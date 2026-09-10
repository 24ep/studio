import { minioClient, MINIO_BUCKET } from '@/lib/minio';

export interface DownloadedStorageFile {
  buffer: ArrayBuffer;
  contentType: string;
}

export async function getDownloadedStorageFile(filePath: string): Promise<DownloadedStorageFile> {
  const stream = await minioClient.getObject(MINIO_BUCKET, filePath);
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const fileBuffer = Buffer.concat(chunks);
  const buffer = new ArrayBuffer(fileBuffer.byteLength);
  new Uint8Array(buffer).set(fileBuffer);

  const stat = await minioClient.statObject(MINIO_BUCKET, filePath);

  return {
    buffer,
    contentType: stat.metaData?.['content-type'] || 'application/octet-stream',
  };
}
