import { type NextRequest } from 'next/server';
import { requireBulkUploadCvUser } from './bulk-upload-cv-auth';
import { parseBulkUploadCvRequest } from './bulk-upload-cv-form';
import {
  broadcastBulkUploadQueueUpdate,
  insertBulkUploadQueueJob,
} from './bulk-upload-cv-queue';
import { errorResponse, jsonResponse } from './bulk-upload-cv-response';
import {
  ensureBulkUploadStorageAvailable,
  uploadAdditionalAttachments,
  uploadPrimaryCv,
} from './bulk-upload-cv-storage';

export async function handleBulkUploadCv(request: NextRequest) {
  try {
    const authorization = await requireBulkUploadCvUser(request);
    if (!authorization.ok) {
      return authorization.response;
    }

    const parsed = await parseBulkUploadCvRequest(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    await ensureBulkUploadStorageAvailable();
    const additionalAttachmentPaths = await uploadAdditionalAttachments(
      parsed.data.additionalAttachments,
      authorization.user
    );
    const storedFile = await uploadPrimaryCv(parsed.data.file, authorization.user);

    const uploadQueueJob = await insertBulkUploadQueueJob(
      authorization.user,
      parsed.data,
      storedFile,
      additionalAttachmentPaths
    );

    await broadcastBulkUploadQueueUpdate();

    return jsonResponse(request, { success: true, uploadQueueJob }, 201);
  } catch (error) {
    console.error('Bulk upload CV error:', error);
    return errorResponse(
      request,
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
