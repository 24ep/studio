import type { NextRequest } from 'next/server';

import {
  SimpleErrorHandler,
  createInternalServerError,
} from '@/lib/errors';
import { sanitizeFilename } from '@/lib/fileUtils';
import { ensureBucketExists, minioClient, MINIO_BUCKET } from '@/lib/minio';

import {
  buildAvatarObjectName,
  buildAvatarPreviewUrl,
  getAvatarRouteErrorMessage,
} from '../../../../applicants/[id]/avatar/avatar-route-utils';

export async function ensureAvatarV1StorageReady(req: NextRequest) {
  try {
    await ensureBucketExists();
    return null;
  } catch (error) {
    const errorMessage = getAvatarRouteErrorMessage(error, String(error));
    return SimpleErrorHandler.handleApiError(
      req,
      createInternalServerError(`Storage service unavailable: ${errorMessage}`)
    );
  }
}

export async function uploadAvatarV1File({
  applicantId,
  file,
  userId,
}: {
  applicantId: string;
  file: File;
  userId: string;
}) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const objectName = buildAvatarObjectName(applicantId, file.name);

  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': file.type,
    'x-amz-meta-originalname': sanitizeFilename(file.name),
    'x-amz-meta-uploaded-by': userId,
    'x-amz-meta-upload-date': new Date().toISOString(),
  });

  return buildAvatarPreviewUrl(objectName);
}
