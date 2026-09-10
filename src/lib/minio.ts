import { Client as Minio } from 'minio';

import {
  enforcePrivateBucketPolicyForClient,
  isUnsupportedBucketPolicyError,
} from './minio-security-policy';
import { getMinioObjectUrl } from './minio-url-utils';
import {
  buildMinioClientConfig,
  buildMinioSkippedResult,
  getMinioErrorMessage,
  isMinioBuildPhase,
  MINIO_BUCKET,
  MINIO_PUBLIC_BASE_URL,
  warnForInsecureProductionMinioConfig,
} from './minio-config';
import {
  checkMinioAvailability,
  ensureMinioBucketExists,
  getMinioBucketInfo,
  initializeMinioClient,
  setMinIOCORSForClient,
} from './minio-bucket-lifecycle';

export { MINIO_BUCKET, MINIO_PUBLIC_BASE_URL } from './minio-config';

warnForInsecureProductionMinioConfig();

export const minioClient = new Minio({
  ...buildMinioClientConfig(),
});

export async function setMinIOCORS() {
  await setMinIOCORSForClient();
}

export async function ensureBucketExists() {
  return ensureMinioBucketExists({
    bucket: MINIO_BUCKET,
    client: minioClient,
  });
}

export async function initializeMinIO() {
  return initializeMinioClient({
    bucket: MINIO_BUCKET,
    client: minioClient,
  });
}

export async function getBucketInfo() {
  return getMinioBucketInfo({
    bucket: MINIO_BUCKET,
    client: minioClient,
  });
}

export async function startupMinIOInitialization() {
  if (isMinioBuildPhase()) {
    return {
      status: 'success',
      message: 'MinIO initialization skipped during build',
      bucket: MINIO_BUCKET,
    };
  }

  try {
    const isAvailable = await checkMinioAvailability(minioClient, MINIO_BUCKET);
    if (!isAvailable) {
      console.warn('[MINIO] MinIO is not available. File uploads will not work.');
      return {
        status: 'warning',
        message: 'MinIO is not available. File uploads will not work.',
        bucket: MINIO_BUCKET,
      };
    }

    const result = await initializeMinIO();
    await autoEnforceBucketSecurity();
    return result;
  } catch (error) {
    console.error('[MINIO] Failed to initialize MinIO during startup:', error);
    return {
      status: 'error',
      message: 'Failed to initialize MinIO during startup',
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket: MINIO_BUCKET,
    };
  }
}

export async function getSignedUrl(objectName: string, expiresIn: number = 3600): Promise<string> {
  try {
    return await getMinioObjectUrl({
      bucket: MINIO_BUCKET,
      defaultClient: minioClient,
      expiresIn,
      objectName,
    });
  } catch (error) {
    console.error(`[MINIO] Failed to generate signed URL for '${objectName}':`, error);
    throw new Error(`Failed to generate signed URL: ${getMinioErrorMessage(error)}`);
  }
}

export async function getSignedUrlWithExpiration(objectName: string, expiresInSeconds: number): Promise<string> {
  try {
    return await getSignedUrl(objectName, expiresInSeconds);
  } catch (error) {
    console.error(`[MINIO] Failed to generate signed URL for '${objectName}' with ${expiresInSeconds}s expiration:`, error);
    throw new Error(`Failed to generate signed URL: ${getMinioErrorMessage(error)}`);
  }
}

export async function enforcePrivateBucketPolicy(): Promise<void> {
  try {
    await enforcePrivateBucketPolicyForClient(minioClient, MINIO_BUCKET);
  } catch (error) {
    if (isUnsupportedBucketPolicyError(error)) {
      console.warn(`[STORAGE] Bucket policy API is not implemented for '${MINIO_BUCKET}'. Continuing with provider-managed bucket access.`);
      return;
    }

    console.error(`[MINIO] Failed to enforce private bucket policy for '${MINIO_BUCKET}':`, error);
    throw new Error(`Failed to enforce private bucket policy: ${getMinioErrorMessage(error)}`);
  }
}

export async function autoEnforceBucketSecurity(): Promise<void> {
  try {
    if (process.env.AUTO_ENFORCE_BUCKET_SECURITY === 'false') {
      return;
    }

    if (process.env.ALLOW_PUBLIC_FILES === 'true') {
      console.warn('[MINIO] WARNING: ALLOW_PUBLIC_FILES is set to true - this is a security risk!');
      return;
    }

    if (isMinioBuildPhase()) {
      return;
    }

    await enforcePrivateBucketPolicy();
  } catch (error) {
    console.error('[MINIO] Failed to auto-enforce bucket security:', error);
  }
}
