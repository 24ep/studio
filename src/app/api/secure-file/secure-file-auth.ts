import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import {
  canAccessApplicantFile,
  canAccessHeadcountFile,
  hasApplicantEditPermission,
  hasPositionEditPermission,
  type SecureFileSessionUser,
} from './secure-file-access-utils';

export {
  canAccessApplicantFile,
  canAccessHeadcountFile,
  type SecureFileSessionUser,
} from './secure-file-access-utils';

export type SecureFileSession = {
  user: SecureFileSessionUser;
};

export async function requireSecureFileSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const secureFileSession = session as SecureFileSession;
  if (!hasPermission(secureFileSession.user, 'applicantS_VIEW')) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden: Insufficient permissions to access files' }, { status: 403 }),
    };
  }

  return { ok: true as const, session: secureFileSession };
}

export async function validateSecureFileContext({
  applicantId,
  headcountId,
  session,
}: {
  applicantId: string | null;
  headcountId: string | null;
  session: SecureFileSession;
}) {
  if (applicantId) {
    return validateApplicantFileAccess(session.user, applicantId);
  }

  if (headcountId) {
    return validateHeadcountFileAccess(session.user, headcountId);
  }

  return null;
}

async function validateApplicantFileAccess(user: SecureFileSessionUser, applicantId: string) {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { id: true, recruiterId: true },
  });

  if (!applicant) {
    return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
  }

  if (!hasApplicantEditPermission(user)) {
    return NextResponse.json({ error: 'Insufficient permissions to access Applicant files' }, { status: 403 });
  }

  if (!canAccessApplicantFile(user, applicant.recruiterId)) {
    return NextResponse.json({ error: 'Access denied: You can only access files for your own Applicants' }, { status: 403 });
  }

  return null;
}

async function validateHeadcountFileAccess(user: SecureFileSessionUser, headcountId: string) {
  const headcount = await prisma.headcount.findUnique({
    where: { id: headcountId },
    select: { id: true, position: { select: { recruiterId: true } } },
  });

  if (!headcount) {
    return NextResponse.json({ error: 'Headcount not found' }, { status: 404 });
  }

  if (!hasPositionEditPermission(user)) {
    return NextResponse.json({ error: 'Insufficient permissions to access headcount files' }, { status: 403 });
  }

  if (!canAccessHeadcountFile(user, headcount.position?.recruiterId)) {
    return NextResponse.json({ error: 'Access denied: You can only access files for your own headcounts' }, { status: 403 });
  }

  return null;
}
