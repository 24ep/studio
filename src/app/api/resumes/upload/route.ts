import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';
import { auth } from '@/auth';
import {
  buildResumeUploadPermissionFlags,
  canAttemptResumeUpload,
} from './resume-upload-route-utils';
import { handleValidResumeUpload } from './resume-upload-handler';
import { parseResumeUploadRequest } from './resume-upload-request';

export const dynamic = 'force-dynamic';


/**
 * @openapi
 * /api/resumes/upload:
 *   post:
 *     summary: Upload a resume
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

export async function POST(request: NextRequest) {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const resumePermissions = buildResumeUploadPermissionFlags(session.user, hasAnyPermission);
  if (!canAttemptResumeUpload(resumePermissions)) {
    await logAudit('WARN', `Forbidden attempt to upload resume by ${actingUserName}`, 'API:Resumes:Upload', actingUserId);
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions to manage Applicant resumes' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const formData = await request.formData();
    const parsed = await parseResumeUploadRequest({
      actingUserId,
      actingUserName,
      formData,
      targetApplicantId: url.searchParams.get('applicantId'),
    });

    if (!parsed.ok) {
      return parsed.response;
    }

    return handleValidResumeUpload({
      actingUserId,
      actingUserName,
      parsed: parsed.value,
      resumePermissions,
      sessionUser: session.user,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    await logAudit('ERROR', `Resume upload failed by ${actingUserName}. Error: ${(error as Error).message}`, 'API:Resumes:Upload', actingUserId, {
      applicantId: new URL(request.url).searchParams.get('applicantId'),
      error: (error as Error).message
    });
    return NextResponse.json({ message: (error as Error).message || 'Internal server error' }, { status: 500 });
  }
}

