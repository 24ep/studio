import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { isSettingsPreviewImage } from './secure-file-preview-request';
import {
  canAccessOwnedPreviewResource,
  getApplicantPreviewEditPermissions,
  getPositionPreviewEditPermissions,
  type PreviewEditPermissions,
} from './secure-file-preview-permission-utils';

export type PreviewSessionUser = {
  id: string;
  role?: string;
  modulePermissions?: string[];
};

export type PreviewSession = {
  user: PreviewSessionUser;
};

function hasAnyPreviewPermission(user: PreviewSessionUser) {
  return hasPermission(user, 'applicantS_VIEW')
    || hasPermission(user, 'POSITIONS_VIEW')
    || user.role === 'Admin';
}

export async function requireSecureFilePreviewSession(request: NextRequest, filePath: string, applicantId: string | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[SECURE-PREVIEW] No session found for image request', {
        url: request.url,
        cookies: request.headers.get('cookie') ? 'present' : 'missing',
        referer: request.headers.get('referer'),
      });
      return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const previewSession = session as PreviewSession;
    const isSettingsImage = isSettingsPreviewImage(filePath, applicantId);
    if (!isSettingsImage && !hasAnyPreviewPermission(previewSession.user)) {
      console.error('[SECURE-PREVIEW] User lacks required permissions:', session.user.id);
      return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    return { ok: true as const, session: previewSession };
  } catch (sessionError) {
    console.error('[SECURE-PREVIEW] Error reading session:', sessionError);
    return { ok: false as const, response: NextResponse.json({ error: 'Authentication error' }, { status: 401 }) };
  }
}

export async function validateSecureFilePreviewContext({
  session,
  filePath,
  applicantId,
  headcountId,
}: {
  session: PreviewSession;
  filePath: string;
  applicantId: string | null;
  headcountId: string | null;
}) {
  if (isSettingsPreviewImage(filePath, applicantId)) {
    return null;
  }

  try {
    if (applicantId) {
      const applicant = await prisma.applicant.findUnique({
        where: { id: applicantId },
        select: { id: true, recruiterId: true },
      });
      if (!applicant) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });

      if (!canAccessPreviewOwner(session.user, applicant.recruiterId, getApplicantPreviewEditPermissions(session.user))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (headcountId) {
      const headcount = await prisma.headcount.findUnique({
        where: { id: headcountId },
        select: { id: true, position: { select: { recruiterId: true } } },
      });
      if (!headcount) return NextResponse.json({ error: 'Headcount not found' }, { status: 404 });

      if (!canAccessPreviewOwner(session.user, headcount.position?.recruiterId, getPositionPreviewEditPermissions(session.user))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  } catch {
    return NextResponse.json({ error: 'Authorization check failed' }, { status: 500 });
  }

  return null;
}

function canAccessPreviewOwner(
  user: PreviewSessionUser,
  ownerId: string | null | undefined,
  permissions: PreviewEditPermissions
) {
  return canAccessOwnedPreviewResource(user, ownerId, permissions);
}
