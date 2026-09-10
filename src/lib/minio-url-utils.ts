import { Client as Minio } from 'minio';

import { buildStorageConfig } from './storage-config';

export function buildSecureFileStreamUrl(objectName: string, expiresIn: number) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:8021';
  return `${baseUrl}/api/secure-file/stream?filePath=${encodeURIComponent(objectName)}&expiresIn=${expiresIn}`;
}

function createPublicStorageClient(publicBaseUrl: string) {
  const storageConfig = buildStorageConfig();
  const publicUrl = new URL(publicBaseUrl);
  return new Minio({
    endPoint: publicUrl.hostname,
    port: parseInt(publicUrl.port || (publicUrl.protocol === 'https:' ? '443' : '80'), 10),
    useSSL: publicUrl.protocol === 'https:',
    accessKey: storageConfig.accessKey,
    secretKey: storageConfig.secretKey,
  });
}

export async function getMinioObjectUrl({
  bucket,
  defaultClient,
  expiresIn,
  objectName,
}: {
  bucket: string;
  defaultClient: Minio;
  expiresIn: number;
  objectName: string;
}) {
  const storageConfig = buildStorageConfig();

  if (!storageConfig.signedUrlsInWebhooks) {
    return buildSecureFileStreamUrl(objectName, expiresIn);
  }

  if (storageConfig.publicBaseUrl) {
    return createPublicStorageClient(storageConfig.publicBaseUrl).presignedGetObject(bucket, objectName, expiresIn);
  }

  return defaultClient.presignedGetObject(bucket, objectName, expiresIn);
}
