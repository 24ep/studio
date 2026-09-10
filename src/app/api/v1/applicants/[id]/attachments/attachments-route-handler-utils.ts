import type { NextRequest } from 'next/server';
import {
  SimpleErrorHandler,
  createInternalServerError,
} from '@/lib/errors';
import {
  type AttachmentApplicantAccessRow,
  requireAttachmentApplicant,
} from './attachments-route-auth';

export type AttachmentAccessValidator = (applicant: AttachmentApplicantAccessRow) => Response | null;

export async function requireApplicantAndAccess(
  request: NextRequest,
  applicantId: string,
  validateAccess: AttachmentAccessValidator
) {
  const applicantResult = await requireAttachmentApplicant(request, applicantId);
  if (!applicantResult.ok) {
    return applicantResult;
  }

  const accessResponse = validateAccess(applicantResult.applicant);
  return accessResponse
    ? { ok: false as const, response: accessResponse }
    : { ok: true as const, applicant: applicantResult.applicant };
}

export function getAttachmentErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function handleAttachmentInternalError(
  request: NextRequest,
  action: string,
  err: unknown,
) {
  return SimpleErrorHandler.handleApiError(
    request,
    createInternalServerError(`Error ${action}: ${getAttachmentErrorMessage(err)}`)
  );
}

export function isAttachmentUrlAuthorizationError(errorMessage: string) {
  return errorMessage.includes('401')
    || errorMessage.includes('Unauthorized')
    || errorMessage.includes('invalid or expired');
}

export function getTruncatedAttachmentUrl(fileUrl: string) {
  return fileUrl.length > 150
    ? `${fileUrl.substring(0, 150)}...`
    : fileUrl;
}

export function handleAttachmentUrlUploadError(
  request: NextRequest,
  err: unknown,
  fileUrl: string,
) {
  const errorMessage = getAttachmentErrorMessage(err);

  if (isAttachmentUrlAuthorizationError(errorMessage)) {
    const urlForError = getTruncatedAttachmentUrl(fileUrl);
    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError(`Error uploading attachment from URL: ${errorMessage}. URL: ${urlForError}. Please ensure the Authorization token in the request body is valid and not expired.`)
    );
  }

  return SimpleErrorHandler.handleApiError(
    request,
    createInternalServerError(`Error uploading attachment from URL: ${errorMessage}`)
  );
}
