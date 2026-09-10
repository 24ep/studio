import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { sendEmployeePasswordSetupEmail } from '@/lib/hr/employee-account-email';
import {
  EmployeeAccountConfigurationError,
  prismaTransactionQueryClient,
  provisionEmployeePlatformAccount,
} from '@/lib/hr/employee-account-onboarding';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type EmployeeAccountSourceRow = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  deliveryEmail: string | null;
};

function canManagePeople(user: Parameters<typeof hasAnyPermission>[0]) {
  return hasAnyPermission(user, ['HR_PEOPLE_MANAGE'] as PlatformModuleId[]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!canManagePeople(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR people permission.' }, { status: 403 });
  }

  const { id: employeeId } = await params;

  try {
    const account = await prisma.$transaction(async (tx) => {
      const employees = await tx.$queryRaw<EmployeeAccountSourceRow[]>`
        SELECT
          employee.id,
          employee_number AS "employeeNumber",
          first_name AS "firstName",
          last_name AS "lastName",
          job_title AS "jobTitle",
          COALESCE(applicant.email, employee.email) AS "deliveryEmail"
        FROM hr_employees employee
        LEFT JOIN "Applicant" applicant ON applicant.id = employee.applicant_id
        WHERE employee.id = ${employeeId}::uuid
        LIMIT 1
      `;
      const employee = employees[0];
      if (!employee) return null;

      return provisionEmployeePlatformAccount(
        prismaTransactionQueryClient(tx),
        {
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          firstName: employee.firstName,
          lastName: employee.lastName,
          jobTitle: employee.jobTitle,
          deliveryEmail: employee.deliveryEmail,
        },
      );
    });

    if (!account) {
      return NextResponse.json({ message: 'Employee not found.' }, { status: 404 });
    }

    let setupEmail: { sent: boolean; error?: string } | undefined;
    if (account.invitation) {
      const origin = process.env.NEXTAUTH_URL || process.env.AUTH_URL || request.nextUrl.origin;
      const emailResult = await sendEmployeePasswordSetupEmail(account.invitation, origin);
      setupEmail = {
        sent: emailResult.success,
        ...(emailResult.error ? { error: emailResult.error } : {}),
      };
    }

    await logAudit(
      'AUDIT',
      account.accountCreated
        ? 'Platform account created from employee profile.'
        : 'Existing employee platform account resolved from employee profile.',
      'API:HR:Employees:SystemAccount:Create',
      session.user.id,
      {
        employeeId,
        userId: account.userId,
        loginEmail: account.loginEmail,
        accountCreated: account.accountCreated,
        setupEmail,
      },
    );

    return NextResponse.json({
      message: account.accountCreated ? 'System account created.' : 'System account is already available.',
      account: {
        userId: account.userId,
        loginEmail: account.loginEmail,
        role: 'Employee',
        isActive: true,
        accountCreated: account.accountCreated,
        invitationPending: Boolean(account.invitation),
        setupEmail,
      },
    }, { status: account.accountCreated ? 201 : 200 });
  } catch (error) {
    console.error('[HR:Employees:SystemAccount] Failed:', error);
    if (error instanceof EmployeeAccountConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'Unable to create the system account.',
    }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!canManagePeople(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR people permission.' }, { status: 403 });
  }

  const { id: employeeId } = await params;

  try {
    const cancelled = await prisma.$transaction(async (tx) => {
      const accounts = await tx.$queryRaw<Array<{ userId: string; hasSignedIn: boolean }>>`
        SELECT
          employee.user_id AS "userId",
          EXISTS (
            SELECT 1
            FROM "UserActivityLog" activity
            WHERE activity.user_id = employee.user_id
              AND activity.action = 'SIGN_IN'
          ) AS "hasSignedIn"
        FROM hr_employees employee
        WHERE employee.id = ${employeeId}::uuid
          AND employee.user_id IS NOT NULL
        LIMIT 1
      `;
      const account = accounts[0];
      if (!account) return null;
      if (account.hasSignedIn) {
        throw new Error('This invitation cannot be cancelled because the employee has already signed in.');
      }

      await tx.$executeRaw`
        UPDATE password_setup_tokens
        SET used_at = NOW()
        WHERE user_id = ${account.userId}::uuid
          AND used_at IS NULL
      `;
      await tx.user.update({
        where: { id: account.userId },
        data: { isActive: false },
      });
      return account;
    });

    if (!cancelled) {
      return NextResponse.json({ message: 'Employee platform invitation not found.' }, { status: 404 });
    }

    await logAudit(
      'AUDIT',
      'Employee platform invitation cancelled.',
      'API:HR:Employees:SystemAccount:CancelInvitation',
      session.user.id,
      { employeeId, userId: cancelled.userId },
    );

    return NextResponse.json({ message: 'Invitation cancelled.' });
  } catch (error) {
    console.error('[HR:Employees:SystemAccount:CancelInvitation] Failed:', error);
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'Unable to cancel the invitation.',
    }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!canManagePeople(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR people permission.' }, { status: 403 });
  }

  const { id: employeeId } = await params;
  const body = await request.json().catch(() => null) as { avatarUrl?: unknown; isActive?: unknown } | null;
  const hasAvatar = Boolean(body && Object.prototype.hasOwnProperty.call(body, 'avatarUrl'));
  const hasAccess = Boolean(body && Object.prototype.hasOwnProperty.call(body, 'isActive'));
  if (!body || (!hasAvatar && !hasAccess)
    || (hasAvatar && body.avatarUrl !== null && typeof body.avatarUrl !== 'string')
    || (hasAccess && typeof body.isActive !== 'boolean')) {
    return NextResponse.json({ message: 'A valid avatar URL or access status is required.' }, { status: 400 });
  }

  const employees = await prisma.$queryRaw<Array<{ userId: string | null }>>`
    SELECT user_id AS "userId"
    FROM hr_employees
    WHERE id = ${employeeId}::uuid
    LIMIT 1
  `;
  const userId = employees[0]?.userId;
  if (!userId) {
    return NextResponse.json({ message: 'Create or link a platform account before uploading an avatar.' }, { status: 400 });
  }

  const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() || null : null;
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(hasAvatar ? { avatarUrl } : {}),
      ...(hasAccess ? { isActive: body.isActive as boolean } : {}),
    },
  });
  await logAudit(
    'AUDIT',
    hasAccess ? `Employee platform access ${body.isActive ? 'enabled' : 'disabled'}.` : avatarUrl ? 'Employee platform avatar updated.' : 'Employee platform avatar removed.',
    hasAccess ? 'API:HR:Employees:SystemAccount:Access' : 'API:HR:Employees:SystemAccount:Avatar',
    session.user.id,
    { employeeId, userId },
  );

  return NextResponse.json({ ...(hasAvatar ? { avatarUrl } : {}), ...(hasAccess ? { isActive: body.isActive } : {}) });
}
