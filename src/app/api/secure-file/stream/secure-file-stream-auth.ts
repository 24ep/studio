import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export type StreamSessionUser = {
  id: string;
  role?: string;
  modulePermissions?: string[];
};

export type StreamSession = {
  user: StreamSessionUser;
};

function hasAnyStreamViewPermission(user: StreamSessionUser) {
  return hasPermission(user, 'applicantS_VIEW')
    || hasPermission(user, 'POSITIONS_VIEW')
    || user.role === 'Admin';
}

export async function requireSecureFileStreamSession() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.error('[SECURE-STREAM] No session found for image request');
      return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const streamSession = session as StreamSession;
    if (!hasAnyStreamViewPermission(streamSession.user)) {
      console.error('[SECURE-STREAM] User lacks required permissions:', session.user.id);
      return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    return { ok: true as const, session: streamSession };
  } catch (sessionError) {
    console.error('[SECURE-STREAM] Error reading session:', sessionError);
    return { ok: false as const, response: NextResponse.json({ error: 'Authentication error' }, { status: 401 }) };
  }
}

export async function validateSecureFileStreamContext({
  session,
  applicantId,
  headcountId,
}: {
  session: StreamSession;
  applicantId: string | null;
  headcountId: string | null;
}) {
  try {
    if (applicantId) {
      const applicant = await prisma.applicant.findUnique({
        where: { id: applicantId },
        select: { id: true, recruiterId: true },
      });
      if (!applicant) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });

      const hasGlobalEdit = hasGlobalApplicantEdit(session.user);
      const hasOwnEdit = hasOwnApplicantEdit(session.user);
      if (session.user.role !== 'Admin' && !hasGlobalEdit && !hasOwnEdit) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (session.user.role !== 'Admin' && !hasGlobalEdit && applicant.recruiterId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (headcountId) {
      const headcount = await prisma.headcount.findUnique({
        where: { id: headcountId },
        select: { id: true, position: { select: { recruiterId: true } } },
      });
      if (!headcount) return NextResponse.json({ error: 'Headcount not found' }, { status: 404 });

      const hasGlobalEdit = hasGlobalPositionEdit(session.user);
      const hasOwnEdit = hasOwnPositionEdit(session.user);
      if (session.user.role !== 'Admin' && !hasGlobalEdit && !hasOwnEdit) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (session.user.role !== 'Admin' && !hasGlobalEdit && headcount.position?.recruiterId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  } catch {
    return NextResponse.json({ error: 'Authorization check failed' }, { status: 500 });
  }

  return null;
}

function hasGlobalApplicantEdit(user: StreamSessionUser) {
  return user.modulePermissions?.includes('applicantS_EDIT_BASIC')
    || user.modulePermissions?.includes('applicantS_EDIT_SENSITIVE');
}

function hasOwnApplicantEdit(user: StreamSessionUser) {
  return user.modulePermissions?.includes('applicantS_EDIT_BASIC_OWN')
    || user.modulePermissions?.includes('applicantS_EDIT_SENSITIVE_OWN');
}

function hasGlobalPositionEdit(user: StreamSessionUser) {
  return user.modulePermissions?.includes('POSITIONS_EDIT_BASIC')
    || user.modulePermissions?.includes('POSITIONS_EDIT_SENSITIVE');
}

function hasOwnPositionEdit(user: StreamSessionUser) {
  return user.modulePermissions?.includes('POSITIONS_EDIT_BASIC_OWN')
    || user.modulePermissions?.includes('POSITIONS_EDIT_SENSITIVE_OWN');
}
