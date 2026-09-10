import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { buildServerFileUrl } from '@/lib/fileUrls';
import { buildResumeUploadWebhookPayload } from './resume-upload-route-utils';
import { storeResumeUploadFile } from './resume-upload-storage';
import { commitResumeUploadTransaction } from './resume-upload-transaction';
import type { ParsedResumeUploadRequest } from './resume-upload-request';
import type { ResumeUploadPermissionFlags } from './resume-upload-route-utils';
import type { SessionLikeUser } from '@/lib/permissions';

interface HandleValidResumeUploadInput {
  actingUserId: string;
  actingUserName: string;
  parsed: ParsedResumeUploadRequest;
  resumePermissions: ResumeUploadPermissionFlags;
  sessionUser: SessionLikeUser;
}

export async function handleValidResumeUpload({
  actingUserId,
  actingUserName,
  parsed,
  resumePermissions,
  sessionUser,
}: HandleValidResumeUploadInput) {
  const storedResume = await storeResumeUploadFile({
    applicantId: parsed.targetApplicantId,
    file: parsed.file,
  });
  const fileUrl = await buildServerFileUrl(storedResume.objectName, { strategy: 'stream' });
  const webhookPayload = buildResumeUploadWebhookPayload({
    applicantId: parsed.targetApplicantId,
    actingUserId,
    fileName: storedResume.originalName,
    fileUrl,
    mimeType: parsed.file.type,
    positionId: parsed.positionId,
    sourceId: parsed.sourceId,
  });

  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await commitResumeUploadTransaction({
      actingUserId,
      applicantId: parsed.targetApplicantId,
      bufferLength: storedResume.buffer.length,
      client,
      fileName: storedResume.originalName,
      hasGlobalResumePermission: resumePermissions.hasGlobalResumePermission,
      objectName: storedResume.objectName,
      positionId: parsed.positionId,
      sessionUser,
      sourceId: parsed.sourceId,
      webhookPayload,
    });

    if (!result.ok) {
      await logResumeUploadFailureResult({
        actingUserId,
        actingUserName,
        applicantId: parsed.targetApplicantId,
        fileName: storedResume.originalName,
        result,
      });
      return NextResponse.json(result.body, { status: result.status });
    }

    const { applicant } = result.value;
    await logAudit('AUDIT', `Resume '${storedResume.originalName}' uploaded for applicant '${applicant.name ?? parsed.targetApplicantId}' by ${actingUserName}`, 'API:Resumes:Upload', actingUserId, {
      applicantId: parsed.targetApplicantId,
      applicantName: applicant.name,
      fileName: storedResume.originalName,
      fileSize: storedResume.buffer.length,
      filePath: storedResume.objectName,
    });

    return NextResponse.json({
      message: 'Resume uploaded',
      applicant,
      file_path: storedResume.objectName,
      url: fileUrl,
    });
  } finally {
    client.release();
  }
}

async function logResumeUploadFailureResult({
  actingUserId,
  actingUserName,
  applicantId,
  fileName,
  result,
}: {
  actingUserId: string;
  actingUserName: string;
  applicantId: string;
  fileName: string;
  result: { ok: false; status: number; body: { message: string } };
}) {
  if (result.status === 404) {
    await logAudit('ERROR', `Resume upload failed - applicant not found by ${actingUserName}`, 'API:Resumes:Upload', actingUserId, { applicantId, fileName });
  } else if (result.status === 403) {
    await logAudit('WARN', `Forbidden attempt to upload resume by ${actingUserName}: ${result.body.message.replace('Forbidden: ', '')}`, 'API:Resumes:Upload', actingUserId);
  }
}
