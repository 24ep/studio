import { v4 as uuidv4 } from 'uuid';
import { ensureBucketExists, minioClient } from '@/lib/minio';
import { MINIO_BUCKET } from '@/lib/minio-constants';
import { generateUniqueFilename, sanitizeFilename } from '@/lib/fileUtils';
import type { AdditionalAttachmentPath, BulkUploadCvUser, StoredBulkUploadCvFile } from './bulk-upload-cv-types';

export async function ensureBulkUploadStorageAvailable() {
  await ensureBucketExists();
}

async function uploadFileToStorage(file: File, objectName: string, user: BulkUploadCvUser, extraMetadata?: Record<string, string>) {
  const buffer = Buffer.from(await file.arrayBuffer());

  await minioClient.putObject(
    MINIO_BUCKET,
    objectName,
    buffer,
    buffer.length,
    {
      'Content-Type': file.type || 'application/octet-stream',
      'x-amz-meta-originalname': sanitizeFilename(file.name),
      'x-amz-meta-uploaded-by': user.id,
      'x-amz-meta-upload-date': new Date().toISOString(),
      ...extraMetadata,
    }
  );

  return buffer;
}

export async function uploadPrimaryCv(file: File, user: BulkUploadCvUser): Promise<StoredBulkUploadCvFile> {
  const fileName = generateUniqueFilename(file.name);
  const objectName = `resumes/upload-queue/${fileName}`;
  const buffer = await uploadFileToStorage(file, objectName, user, { 'Content-Type': file.type || 'application/octet-stream' });

  return {
    uploadId: uuidv4(),
    fileName,
    objectName,
    size: buffer.length,
  };
}

export async function uploadAdditionalAttachments(files: File[], user: BulkUploadCvUser): Promise<AdditionalAttachmentPath[]> {
  const paths: AdditionalAttachmentPath[] = [];

  for (const file of files) {
    const attachmentFileName = generateUniqueFilename(file.name);
    const attachmentObjectName = `attachments/upload-queue/${attachmentFileName}`;
    const buffer = await uploadFileToStorage(file, attachmentObjectName, user, {
      'x-amz-meta-attachment-type': 'additional',
    });

    paths.push({
      path: attachmentObjectName,
      name: file.name,
      size: buffer.length,
      type: file.type || 'application/octet-stream',
    });
  }

  return paths;
}
