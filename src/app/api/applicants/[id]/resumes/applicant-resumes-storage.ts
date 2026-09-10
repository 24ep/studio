import { v4 as uuidv4 } from 'uuid';
import { minioClient } from '@/lib/minio';
import { MINIO_BUCKET } from '@/lib/minio-constants';

export async function uploadApplicantResumeFile(applicantId: string, file: File) {
  const ext = (file.name || 'pdf').split('.').pop();
  const objectName = `attachments/${applicantId}/${uuidv4()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  await minioClient.putObject(
    MINIO_BUCKET,
    objectName,
    Buffer.from(arrayBuffer),
    undefined,
    { 'Content-Type': file.type || 'application/pdf' }
  );

  return objectName;
}

export function deleteApplicantResumeFile(filePath: string) {
  return minioClient.removeObject(MINIO_BUCKET, filePath);
}
