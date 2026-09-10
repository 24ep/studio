import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { DownloadRouteSession } from './download-route-auth';
import type { DownloadRouteRequestContext } from './download-route-request';

export async function verifyDownloadFileAccess(
  context: DownloadRouteRequestContext,
  session: DownloadRouteSession
) {
  if (context.applicantId) {
    return verifyApplicantFileAccess(context.applicantId, session);
  }

  if (context.headcountId) {
    return verifyHeadcountFileAccess(context.headcountId, session);
  }

  return null;
}

async function verifyApplicantFileAccess(applicantId: string, session: DownloadRouteSession) {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { id: true, recruiterId: true },
  });

  if (!applicant) {
    return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
  }

  const hasGlobalEditPermission = session.user.modulePermissions?.includes('applicantS_EDIT_BASIC') ||
    session.user.modulePermissions?.includes('applicantS_EDIT_SENSITIVE');
  const hasOwnEditPermission = session.user.modulePermissions?.includes('applicantS_EDIT_BASIC_OWN') ||
    session.user.modulePermissions?.includes('applicantS_EDIT_SENSITIVE_OWN');

  if (session.user.role !== 'Admin' && !hasGlobalEditPermission && !hasOwnEditPermission) {
    return NextResponse.json({ error: 'Insufficient permissions to access Applicant files' }, { status: 403 });
  }

  if (session.user.role !== 'Admin' && !hasGlobalEditPermission && applicant.recruiterId !== session.user.id) {
    return NextResponse.json({ error: 'Access denied: You can only access files for your own Applicants' }, { status: 403 });
  }

  return null;
}

async function verifyHeadcountFileAccess(headcountId: string, session: DownloadRouteSession) {
  const headcount = await prisma.headcount.findUnique({
    where: { id: headcountId },
    select: { id: true, position: { select: { recruiterId: true } } },
  });

  if (!headcount) {
    return NextResponse.json({ error: 'Headcount not found' }, { status: 404 });
  }

  const hasGlobalEditPermission = session.user.modulePermissions?.includes('POSITIONS_EDIT_BASIC') ||
    session.user.modulePermissions?.includes('POSITIONS_EDIT_SENSITIVE');
  const hasOwnEditPermission = session.user.modulePermissions?.includes('POSITIONS_EDIT_BASIC_OWN') ||
    session.user.modulePermissions?.includes('POSITIONS_EDIT_SENSITIVE_OWN');

  if (session.user.role !== 'Admin' && !hasGlobalEditPermission && !hasOwnEditPermission) {
    return NextResponse.json({ error: 'Insufficient permissions to access headcount files' }, { status: 403 });
  }

  if (session.user.role !== 'Admin' && !hasGlobalEditPermission && headcount.position?.recruiterId !== session.user.id) {
    return NextResponse.json({ error: 'Access denied: You can only access files for your own headcounts' }, { status: 403 });
  }

  return null;
}
