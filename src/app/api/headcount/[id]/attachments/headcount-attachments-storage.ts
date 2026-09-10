import { v4 as uuidv4 } from 'uuid';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
import { sanitizeFilename } from '@/lib/fileUtils';
import type { HeadcountAttachmentSessionUser } from './headcount-attachments-types';

export async function ensureHeadcountAttachmentBucket() {
  const bucketExists = await minioClient.bucketExists(MINIO_BUCKET);
  if (!bucketExists) {
    await minioClient.makeBucket(MINIO_BUCKET);
  }
}

export function createHeadcountAttachmentObjectName(headcountId: string, fileName: string) {
  const extension = fileName.split('.').pop() || 'bin';
  return `headcount-attachments/${headcountId}/${uuidv4()}.${extension}`;
}

export async function uploadHeadcountAttachmentObject({
  headcountId,
  user,
  file,
  objectName,
}: {
  headcountId: string;
  user: HeadcountAttachmentSessionUser;
  file: File;
  objectName: string;
}) {
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
      'x-amz-meta-headcount-id': headcountId,
    },
  );
}

export async function removeHeadcountAttachmentObject(filePath: string) {
  await minioClient.removeObject(MINIO_BUCKET, filePath);
}

export function buildHeadcountAttachmentStreamUrl(objectName: string) {
  return `${process.env.NEXTAUTH_URL || 'http://localhost:8021'}/api/secure-file/stream?filePath=${encodeURIComponent(objectName)}`;
}
