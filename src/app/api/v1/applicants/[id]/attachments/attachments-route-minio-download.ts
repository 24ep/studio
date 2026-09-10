import { minioClient } from '@/lib/minio';
import { MINIO_BUCKET } from '@/lib/minio-constants';

import {
  inferAttachmentContentType,
} from './attachments-route-pure-utils';
import type { DownloadedAttachmentFile } from './attachments-route-utils';

function getStorageErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined;
  }

  const code = error.code;
  return typeof code === 'string' ? code : undefined;
}

export async function tryDownloadSecureFileFromMinio({
  parsedUrl,
  currentOrigin,
}: {
  parsedUrl: URL;
  currentOrigin: string;
}): Promise<DownloadedAttachmentFile | null> {
  if (!parsedUrl.pathname.includes('/api/secure-file/stream')) {
    return null;
  }

  const filePath = parsedUrl.searchParams.get('filePath');
  if (!filePath) {
    return null;
  }

  const fileNameParam = parsedUrl.searchParams.get('fileName');

  try {
    try {
      await minioClient.statObject(MINIO_BUCKET, filePath);
    } catch (statError) {
      const isDifferentEnvironment = parsedUrl.hostname !== currentOrigin;
      const statErrorCode = getStorageErrorCode(statError);

      if (statErrorCode === 'NotFound' || statErrorCode === 'NoSuchKey') {
        console.warn(`[ATTACHMENTS] File not found in MinIO: ${filePath}. URL is from ${parsedUrl.hostname}, current system: ${process.env.NEXTAUTH_URL || 'unknown'}`);

        if (isDifferentEnvironment) {
          throw new Error(`Failed to download file: The file is from a different environment (${parsedUrl.hostname}) and does not exist in the current MinIO storage. Cross-environment file access requires the file to be available in both MinIO instances, or you must use a direct file URL that supports Bearer token authentication. The secure-file/stream endpoint only supports session-based authentication (cookies), not Bearer tokens.`);
        }

        throw new Error(`Failed to download file: File not found in storage. The file path '${filePath}' does not exist in the current MinIO bucket.`);
      }

      throw statError;
    }

    const stream = await minioClient.getObject(MINIO_BUCKET, filePath);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return {
      buffer: Buffer.concat(chunks),
      fileName: getSecureFileDownloadName(filePath, fileNameParam),
      contentType: inferAttachmentContentType(filePath),
    };
  } catch (minioError) {
    const errorMessage = minioError instanceof Error ? minioError.message : String(minioError);
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      throw minioError;
    }

    console.warn(`[ATTACHMENTS] MinIO direct download failed, falling back to HTTP: ${errorMessage}`);
    return null;
  }
}

function getSecureFileDownloadName(filePath: string, fileNameParam: string | null) {
  if (fileNameParam && fileNameParam !== 'downloaded-file') {
    return fileNameParam;
  }

  const lastPart = filePath.split('/').pop();
  return lastPart && lastPart.includes('.') ? lastPart : 'downloaded-file';
}
