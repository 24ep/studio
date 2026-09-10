import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission, type SessionLikeUser } from '@/lib/permissions';

type RecruitmentStageSession = Session & {
  user: Session['user'] & SessionLikeUser & {
    id?: string;
    email?: string | null;
  };
};

export async function requireRecruitmentStageSession() {
  const session = await auth();
  const actingUserId = session?.user?.id;

  if (!actingUserId) {
    return {
      ok: false as const,
      response: new NextResponse('Unauthorized', { status: 401 }),
    };
  }

  return { ok: true as const, session, actingUserId };
}

export async function requireRecruitmentStageEditPermission(
  session: RecruitmentStageSession,
  actingUserId: string,
  auditAction: 'API:RecruitmentStages:Edit' | 'API:RecruitmentStages:Delete'
) {
  if (hasPermission(session.user, 'RECRUITMENT_STAGES_EDIT')) {
    return null;
  }

  const operation = auditAction.endsWith(':Delete') ? 'delete' : 'update';
  await logAudit(
    'WARN',
    `Forbidden attempt to ${operation} recruitment stage by ${session.user.name || session.user.email}.`,
    auditAction,
    actingUserId
  );
  return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
}
