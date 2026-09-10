import type { SessionLikeUser } from '../../../../lib/permissions';

export interface ResumeUploadPermissionFlags {
  hasGlobalResumePermission: boolean;
  hasOwnResumePermission: boolean;
}

export interface ResumeUploadWebhookPayloadInput {
  applicantId: string;
  actingUserId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  positionId: string | null;
  sourceId: string | null;
}

type PermissionChecker = (
  user: SessionLikeUser | null | undefined,
  required: string[]
) => boolean;

export function normalizeResumeUploadSourceId(sourceIdRaw: FormDataEntryValue | null) {
  return typeof sourceIdRaw === 'string' && sourceIdRaw !== 'null' && sourceIdRaw !== ''
    ? sourceIdRaw
    : null;
}

export function isResumeUploadFile(value: FormDataEntryValue | null): value is File {
  return Boolean(value) && typeof value !== 'string';
}

export function buildResumeUploadPermissionFlags(
  user: SessionLikeUser | null | undefined,
  hasAnyPermission: PermissionChecker
): ResumeUploadPermissionFlags {
  return {
    hasGlobalResumePermission: hasAnyPermission(user, ['applicantS_RESUMES_UPLOAD']),
    hasOwnResumePermission: hasAnyPermission(user, ['applicantS_RESUMES_UPLOAD_OWN']),
  };
}

export function canAttemptResumeUpload({
  hasGlobalResumePermission,
  hasOwnResumePermission,
}: ResumeUploadPermissionFlags) {
  return hasGlobalResumePermission || hasOwnResumePermission;
}

export function buildResumeObjectName(applicantId: string, fileName: string) {
  return `resumes/${applicantId}/${fileName}`;
}

export function buildResumeUploadWebhookPayload({
  applicantId,
  actingUserId,
  fileName,
  fileUrl,
  mimeType,
  positionId,
  sourceId,
}: ResumeUploadWebhookPayloadInput) {
  return {
    inputs: {
      cv_url: fileUrl,
      Applicant_id: applicantId,
      jobId: positionId,
      filename: fileName,
      mimetype: mimeType,
    },
    response_mode: 'blocking',
    user: actingUserId,
    request_type: 'create',
    sourceId,
  };
}
