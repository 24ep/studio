import { NextResponse, type NextRequest } from 'next/server';
import type { QueryResultRow } from 'pg';
import type { DbClient } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { broadcastApplicantUpdate } from '@/lib/simple-broadcaster';
import { canUpdateApplicantPipelineStage, hasAnyPermission } from '@/lib/permissions';
import { validateUuid } from '@/lib/security';
import { extractTransitionIdFromPathname, getTransitionActorLabel } from './transition-detail-utils';

export type TransitionRecordRow = QueryResultRow & {
  id: string;
  applicantId: string;
  applicant_id?: string;
  recruiterId: string | null;
};

export type TransitionRouteUser = {
  email?: string | null;
  id?: string | null;
  modulePermissions?: string[];
  name?: string | null;
  role?: string;
};

export type TransitionRouteSession = {
  user?: TransitionRouteUser | null;
} | null;

export type TransitionRouteAction = 'Delete' | 'Update';

const TRANSITION_LOOKUP_QUERY = `
  SELECT tr.*, tr."applicant_id" as "applicantId", c."recruiterId"
  FROM "TransitionRecord" tr
  JOIN "Applicant" c ON tr."applicant_id" = c.id
  WHERE tr.id = $1
`;

export function resolveTransitionRouteId(request: NextRequest) {
  const id = extractTransitionIdFromPathname(request.nextUrl.pathname);
  if (!id) {
    return { response: NextResponse.json({ message: 'Invalid transition ID' }, { status: 400 }) };
  }

  if (!validateUuid(id)) {
    console.error('[SECURITY] Invalid UUID format in transitions request:', id);
    return { response: NextResponse.json({ message: 'Invalid transition ID format' }, { status: 400 }) };
  }

  return { id };
}

export async function requireTransitionRoutePermission({
  action,
  actingUserId,
  session,
}: {
  action: TransitionRouteAction;
  actingUserId?: string | null;
  session: TransitionRouteSession;
}) {
  if (!actingUserId || !session?.user) {
    return { response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  }

  const hasGlobalPermission = hasAnyPermission(session.user, ['APPLICANTS_PIPELINE_STAGE_UPDATE']);
  const hasOwnPermission = hasAnyPermission(session.user, ['APPLICANTS_PIPELINE_STAGE_UPDATE_OWN']);

  if (!hasGlobalPermission && !hasOwnPermission) {
    await logAudit(
      'WARN',
      `Forbidden attempt to ${action.toLowerCase()} transition by ${getTransitionActorLabel(session.user)}`,
      `API:Transitions:${action}`,
      actingUserId
    );
    return {
      response: NextResponse.json(
        { message: 'Forbidden: Insufficient permissions to manage Applicant transitions' },
        { status: 403 }
      ),
    };
  }

  return { hasGlobalPermission };
}

export async function fetchTransitionRecord(client: DbClient, id: string) {
  const result = await client.query<TransitionRecordRow>(TRANSITION_LOOKUP_QUERY, [id]);
  return result.rowCount === 0 ? null : result.rows[0];
}

export async function enforceTransitionOwnership({
  action,
  actingUserId,
  hasGlobalPermission,
  session,
  transition,
}: {
  action: TransitionRouteAction;
  actingUserId: string;
  hasGlobalPermission: boolean;
  session: TransitionRouteSession;
  transition: TransitionRecordRow;
}) {
  if (hasGlobalPermission || !session?.user) {
    return null;
  }

  const transitionPermission = canUpdateApplicantPipelineStage(session.user, transition.recruiterId, actingUserId);
  if (transitionPermission.canUpdate) {
    return null;
  }

  await logAudit(
    'WARN',
    `Forbidden attempt to ${action.toLowerCase()} transition by ${getTransitionActorLabel(session.user)}: ${transitionPermission.reason}`,
    `API:Transitions:${action}`,
    actingUserId
  );
  return NextResponse.json({ message: `Forbidden: ${transitionPermission.reason}` }, { status: 403 });
}

export function broadcastTransitionChange({
  action,
  actingUserId,
  transition,
  applicantId,
}: {
  action: 'delete' | 'update';
  actingUserId: string;
  applicantId: string;
  transition: TransitionRecordRow;
}) {
  broadcastApplicantUpdate({
    applicantId,
    transition,
    action,
  }, actingUserId);
}
