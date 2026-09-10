import { type NextRequest } from 'next/server';
import {
  SimpleErrorHandler,
  createValidationError,
} from '@/lib/errors';
import {
  createApplicantAttachmentFromBuffer,
  createApplicantAttachmentFromFile,
} from './attachments-route-data';
import {
  type AttachmentRouteUser,
  validateAttachmentUploadAccess,
} from './attachments-route-auth';
import {
  readAttachmentMultipartFile,
  readUrlAttachmentUploadBody,
} from './attachments-route-request';
import { downloadFileFromUrl } from './attachments-route-utils';
import {
  handleAttachmentInternalError,
  handleAttachmentUrlUploadError,
  requireApplicantAndAccess,
} from './attachments-route-handler-utils';

export async function uploadAttachmentFromMultipart({
  applicantId,
  request,
  user,
}: {
  applicantId: string;
  request: NextRequest;
  user: AttachmentRouteUser;
}) {
  try {
    const parsedFile = await readAttachmentMultipartFile(request);
    if (!parsedFile.ok) {
      return parsedFile.response;
    }

    const access = await requireApplicantAndAccess(
      request,
      applicantId,
      (applicant) => validateAttachmentUploadAccess(request, user, applicant)
    );
    if (!access.ok) {
      return access.response;
    }

    const newAttachment = await createApplicantAttachmentFromFile({
      applicantId,
      user,
      file: parsedFile.file,
      label: parsedFile.label,
    });

    return SimpleErrorHandler.createSuccessResponse(request, newAttachment, 201);
  } catch (err) {
    console.error('[ATTACHMENTS] Error uploading attachment:', err);
    return handleAttachmentInternalError(request, 'uploading attachment', err);
  }
}

export async function uploadAttachmentFromUrl({
  applicantId,
  request,
  user,
}: {
  applicantId: string;
  request: NextRequest;
  user: AttachmentRouteUser;
}) {
  const parsedBody = await readUrlAttachmentUploadBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  try {
    const access = await requireApplicantAndAccess(
      request,
      applicantId,
      (applicant) => validateAttachmentUploadAccess(request, user, applicant)
    );
    if (!access.ok) {
      return access.response;
    }

    const { buffer, fileName, contentType } = await downloadFileFromUrl(
      parsedBody.fileUrl,
      parsedBody.downloadHeaders
    );

    const fileValidationError = validateDownloadedAttachment(request, buffer, fileName);
    if (fileValidationError) {
      return fileValidationError;
    }

    const newAttachment = await createApplicantAttachmentFromBuffer({
      applicantId,
      user,
      buffer,
      fileName,
      contentType,
      label: parsedBody.label,
    });

    return SimpleErrorHandler.createSuccessResponse(request, newAttachment, 201);
  } catch (err) {
    console.error('[ATTACHMENTS] Error uploading attachment from URL:', err);
    return handleAttachmentUrlUploadError(request, err, parsedBody.fileUrl);
  }
}

function validateDownloadedAttachment(
  request: NextRequest,
  buffer: Buffer,
  fileName: string
) {
  if (buffer.length === 0) {
    return SimpleErrorHandler.handleApiError(
      request,
      createValidationError('Invalid input - fileUrl: Downloaded file is empty (0 bytes)')
    );
  }

  if (!fileName || fileName.trim() === '') {
    return SimpleErrorHandler.handleApiError(
      request,
      createValidationError('Invalid input - fileUrl: Could not determine filename from URL')
    );
  }

  return null;
}
