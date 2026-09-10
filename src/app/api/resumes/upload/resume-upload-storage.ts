import { randomUUID } from 'crypto';
import { generateUniqueFilename, sanitizeFilename } from '@/lib/fileUtils';
import { minioClient } from '@/lib/minio';
import { MINIO_BUCKET } from '@/lib/minio-constants';
import { buildResumeObjectName } from './resume-upload-route-utils';

export interface StoredResumeUpload {
  buffer: Buffer;
  fileName: string;
  jobId: string;
  objectName: string;
  originalName: string;
}

export async function storeResumeUploadFile({
  applicantId,
  file,
}: {
  applicantId: string;
  file: File;
}): Promise<StoredResumeUpload> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = file.name;
  const fileName = generateUniqueFilename(originalName);
  const objectName = buildResumeObjectName(applicantId, fileName);

  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': file.type,
    'x-amz-meta-originalname': sanitizeFilename(originalName),
  });

  return {
    buffer,
    fileName,
    jobId: randomUUID(),
    objectName,
    originalName,
  };
}
