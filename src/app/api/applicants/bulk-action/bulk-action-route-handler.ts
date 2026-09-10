import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { isJsonObject } from '@/lib/json-types';
import { hasAnyPermission } from '@/lib/permissions';
import { sendEmployeePasswordSetupEmail } from '@/lib/hr/employee-account-email';
import type { PasswordSetupInvitation } from '@/lib/hr/employee-account-onboarding';
import { readRequestJsonResult } from '@/lib/request-json';
import { executeBulkApplicantAction } from './bulk-action-route-actions';
import { broadcastBulkActionPositionUpdates } from './bulk-action-route-realtime';
import {
  bulkActionSchema,
  canPerformBulkApplicantAction,
  getBulkApplicantActionForbiddenMessage,
  logAuditWithClient,
} from './bulk-action-route-utils';
import type { BulkActionClient, BulkActionSessionUser } from './bulk-action-route-types';

async function getClient() {
  return await getPool().connect() as BulkActionClient;
}

function getActingUserName(user: BulkActionSessionUser | undefined, actingUserId: string | undefined) {
  return (user?.name || user?.email || actingUserId || 'System') as string;
}

export async function handleBulkApplicantActionPost(request: NextRequest) {
  const session = await auth();
  const sessionUser = session?.user as BulkActionSessionUser | undefined;
  const actingUserId = sessionUser?.id || undefined;
  const actingUserName = getActingUserName(sessionUser, actingUserId);

  if (!actingUserId || !sessionUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
  const actionType = isJsonObject(body) ? body.action : undefined;
  const hasPermission = canPerformBulkApplicantAction(sessionUser, actionType, hasAnyPermission);
  if (!hasPermission) {
    return NextResponse.json({ message: getBulkApplicantActionForbiddenMessage(actionType) }, { status: 403 });
  }

  const validationResult = bulkActionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  let client: BulkActionClient | undefined;
  const passwordSetupInvitations: PasswordSetupInvitation[] = [];
  try {
    client = await getClient();
    await client.query('BEGIN');
    await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    const actionResult = await executeBulkApplicantAction({
      client,
      sessionUser,
      actingUserId,
      actingUserName,
      data: validationResult.data,
      passwordSetupInvitations,
    });

    if ('earlyExit' in actionResult) {
      await client.query('ROLLBACK');
      if (actionResult.earlyExit.audit) {
        await logAuditWithClient(
          client,
          actionResult.earlyExit.audit.level,
          actionResult.earlyExit.audit.message,
          'API:Applicants:BulkAction',
          actingUserId
        );
      }
      return NextResponse.json(actionResult.earlyExit.body, { status: actionResult.earlyExit.status });
    }

    await client.query('COMMIT');

    if (passwordSetupInvitations.length > 0) {
      const origin = process.env.NEXTAUTH_URL || process.env.AUTH_URL || request.nextUrl.origin;
      let sent = 0;
      const failures: string[] = [];
      for (const invitation of passwordSetupInvitations) {
        const delivery = await sendEmployeePasswordSetupEmail(invitation, origin);
        if (delivery.success) {
          sent += 1;
        } else {
          failures.push(delivery.error || 'Unknown email delivery error');
        }
      }
      actionResult.result.setupEmailDelivery = {
        requested: passwordSetupInvitations.length,
        sent,
        failed: failures.length,
        ...(failures.length > 0 ? { errors: failures } : {}),
      };
    }

    if (
      validationResult.data.action === 'change_status'
      && 'headcountAssignments' in actionResult.result
      && 'autoCloseResults' in actionResult.result
    ) {
      await broadcastBulkActionPositionUpdates(client);
    }

    await logAuditWithClient(
      client,
      'AUDIT',
      `${actionResult.auditMessage} by ${actingUserName}.`,
      'API:Applicants:BulkAction',
      actingUserId,
      {
        action: validationResult.data.action,
        applicantIds: validationResult.data.applicantIds,
        result: actionResult.result,
      }
    );

    return NextResponse.json({
      message: 'Bulk action completed successfully',
      ...actionResult.result,
    });
  } catch (error) {
    const caughtError = error as Error;
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    console.error('Bulk action error details:', {
      error: caughtError.message,
      stack: caughtError.stack,
      action: validationResult.data.action,
      applicantIds: validationResult.data.applicantIds,
    });

    if (client) {
      try {
        await logAuditWithClient(
          client,
          'ERROR',
          `Bulk action failed. Error: ${caughtError.message}`,
          'API:Applicants:BulkAction',
          actingUserId,
          {
            action: validationResult.data.action,
            applicantIds: validationResult.data.applicantIds,
            input: body,
          }
        );
      } catch (auditError) {
        console.error('Failed to log audit entry:', auditError);
      }
    }

    return NextResponse.json({
      message: 'Error performing bulk action',
      error: caughtError.message,
      details: process.env.NODE_ENV === 'development' ? caughtError.stack : undefined,
    }, { status: 500 });
  } finally {
    client?.release();
  }
}
