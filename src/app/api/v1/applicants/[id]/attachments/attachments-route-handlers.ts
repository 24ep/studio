import { type NextRequest } from 'next/server';
import {
  SimpleErrorHandler,
  createNotFoundError,
} from '@/lib/errors';
import {
  deleteApplicantAttachment,
  listApplicantAttachments,
  setApplicantPrimaryAttachment,
} from './attachments-route-data';
import {
  requireAttachmentRouteUser,
  validateAttachmentDeleteAccess,
  validateAttachmentManageAccess,
  validateAttachmentUploadAccess,
  validateAttachmentViewAccess,
  validateInitialAttachmentUploadAccess,
} from './attachments-route-auth';
import {
  readAttachmentIdBody,
  routeMismatchResponse,
} from './attachments-route-request';
import {
  handleAttachmentInternalError,
  requireApplicantAndAccess,
} from './attachments-route-handler-utils';
import {
  uploadAttachmentFromMultipart,
  uploadAttachmentFromUrl,
} from './attachments-route-upload-handlers';

export type AttachmentRouteContext = { params: Promise<{ id: string }> };

export async function handleListAttachments(request: NextRequest, { params }: AttachmentRouteContext) {
  const mismatch = routeMismatchResponse(request);
  if (mismatch) {
    return mismatch;
  }

  const auth = await requireAttachmentRouteUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const access = await requireApplicantAndAccess(
      request,
      id,
      (applicant) => validateAttachmentViewAccess(request, auth.user, applicant)
    );
    if (!access.ok) {
      return access.response;
    }

    return SimpleErrorHandler.createSuccessResponse(request, await listApplicantAttachments(id));
  } catch (err) {
    return handleAttachmentInternalError(request, 'fetching attachments', err);
  }
}

export async function handleUploadAttachment(request: NextRequest, { params }: AttachmentRouteContext) {
  const mismatch = routeMismatchResponse(request);
  if (mismatch) {
    return mismatch;
  }

  const auth = await requireAttachmentRouteUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const initialAccess = validateInitialAttachmentUploadAccess(request, auth.user);
  if (initialAccess) {
    return initialAccess;
  }

  const { id } = await params;

  return uploadAttachmentFromMultipart({
    applicantId: id,
    request,
    user: auth.user,
  });
}

export async function handleUploadAttachmentFromUrl(request: NextRequest, { params }: AttachmentRouteContext) {
  const auth = await requireAttachmentRouteUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const initialAccess = validateInitialAttachmentUploadAccess(request, auth.user);
  if (initialAccess) {
    return initialAccess;
  }

  const { id } = await params;
  return uploadAttachmentFromUrl({
    applicantId: id,
    request,
    user: auth.user,
  });
}

export async function handleSetPrimaryAttachment(request: NextRequest, { params }: AttachmentRouteContext) {
  const auth = await requireAttachmentRouteUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const parsedBody = await readAttachmentIdBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { id } = await params;

  try {
    const access = await requireApplicantAndAccess(
      request,
      id,
      (applicant) => validateAttachmentManageAccess(request, auth.user, applicant)
    );
    if (!access.ok) {
      return access.response;
    }

    const updated = await setApplicantPrimaryAttachment(id, parsedBody.attachmentId);
    return SimpleErrorHandler.createSuccessResponse(request, updated);
  } catch (err) {
    return handleAttachmentInternalError(request, 'setting primary attachment', err);
  }
}

export async function handleDeleteAttachment(request: NextRequest, { params }: AttachmentRouteContext) {
  const auth = await requireAttachmentRouteUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const parsedBody = await readAttachmentIdBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { id } = await params;

  try {
    const access = await requireApplicantAndAccess(
      request,
      id,
      (applicant) => validateAttachmentDeleteAccess(request, auth.user, applicant)
    );
    if (!access.ok) {
      return access.response;
    }

    const result = await deleteApplicantAttachment(id, parsedBody.attachmentId);
    if (result.status === 'not-found') {
      return SimpleErrorHandler.handleApiError(request, createNotFoundError('Attachment not found'));
    }

    return SimpleErrorHandler.createSuccessResponse(request, { message: 'Deleted' });
  } catch (err) {
    return handleAttachmentInternalError(request, 'deleting attachment', err);
  }
}
