import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import {
  canEditApplicant,
  canUpdateApplicantPipelineStage,
  hasAnyPermission,
  type SessionLikeUser,
} from '@/lib/permissions';
import {
  buildApplicantUpdatePermissionFlags,
  canAttemptApplicantUpdate,
} from './applicant-detail-route-utils';
import type { ApplicantDetailUpdateClient } from './applicant-detail-update-db';

export async function requireApplicantUpdateAccess() {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const updatePermissionFlags = buildApplicantUpdatePermissionFlags(session.user, hasAnyPermission);
  if (!canAttemptApplicantUpdate(updatePermissionFlags)) {
    await logAudit(
      'WARN',
      `Forbidden attempt to update Applicant by ${actingUserName}.`,
      'API:Applicants:Update',
      actingUserId
    );
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Forbidden: Insufficient permissions to update applicants' },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, session, actingUserId, actingUserName };
}

export async function validateApplicantUpdateOwnershipAccess({
  client,
  sessionUser,
  recruiterId,
  actingUserId,
  actingUserName,
  status,
  oldStatus,
}: {
  client: ApplicantDetailUpdateClient;
  sessionUser: SessionLikeUser;
  recruiterId: string | null;
  actingUserId: string;
  actingUserName: string;
  status: unknown;
  oldStatus: unknown;
}) {
  const editPermission = canEditApplicant(sessionUser, recruiterId, actingUserId);
  if (!editPermission.canEdit) {
    await client.query('ROLLBACK');
    await logAudit(
      'WARN',
      `Forbidden attempt to edit Applicant by ${actingUserName}: ${editPermission.reason}`,
      'API:Applicants:Update',
      actingUserId
    );
    return NextResponse.json({ message: `Forbidden: ${editPermission.reason}` }, { status: 403 });
  }

  if (status !== undefined && status !== oldStatus) {
    const pipelinePermission = canUpdateApplicantPipelineStage(sessionUser, recruiterId, actingUserId);
    if (!pipelinePermission.canUpdate) {
      await client.query('ROLLBACK');
      await logAudit(
        'WARN',
        `Forbidden attempt to update Applicant pipeline stage by ${actingUserName}: ${pipelinePermission.reason}`,
        'API:Applicants:Update',
        actingUserId
      );
      return NextResponse.json({ message: `Forbidden: ${pipelinePermission.reason}` }, { status: 403 });
    }
  }

  return null;
}
