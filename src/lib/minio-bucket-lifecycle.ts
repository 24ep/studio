import type { Client as Minio } from 'minio';

import {
  enforcePrivateBucketPolicyForClient,
  isUnsupportedBucketPolicyError,
} from './minio-security-policy';
import {
  buildMinioSkippedResult,
  getMinioErrorMessage,
  isMinioBuildPhase,
} from './minio-config';

let bucketInitialized = false;
let corsWarningShown = false;

function isStorageCorsEnvConfigured(): boolean {
  return Object.keys(process.env).some(
    (name) => name.startsWith('MINIO_API_CORS_') || name.startsWith('STORAGE_API_CORS_'),
  );
}

async function applyPrivateBucketPolicy({
  bucket,
  client,
  warningMessage,
}: {
  bucket: string;
  client: Minio;
  warningMessage: string;
}) {
  try {
    await enforcePrivateBucketPolicyForClient(client, bucket);
  } catch (policyError) {
    if (isUnsupportedBucketPolicyError(policyError)) {
      console.warn(`[STORAGE] Bucket policy API is not implemented for '${bucket}'. Continuing with provider-managed bucket access.`);
      return;
    }

    console.warn(warningMessage, policyError);
  }
}

export async function setMinIOCORSForClient() {
  if (!corsWarningShown) {
    if (isStorageCorsEnvConfigured()) {
      console.log('[STORAGE] CORS is configured via *API_CORS_* environment variables.');
    } else {
      console.warn('[STORAGE] Runtime CORS config is skipped. Configure CORS through your storage provider settings (or MINIO_API_CORS_* if using MinIO-compatible service).');
    }

    corsWarningShown = true;
  }
}

export async function ensureMinioBucketExists({
  bucket,
  client,
}: {
  bucket: string;
  client: Minio;
}) {
  if (isMinioBuildPhase()) {
    return buildMinioSkippedResult('Bucket check skipped during build');
  }

  if (bucketInitialized) {
    return buildMinioSkippedResult('Bucket already initialized');
  }

  try {
    const exists = await client.bucketExists(bucket);

    if (!exists) {
      await client.makeBucket(bucket);
      await setMinIOCORSForClient();
      await applyPrivateBucketPolicy({
        bucket,
        client,
        warningMessage: `[MINIO] Failed to set bucket policy for '${bucket}':`,
      });

      try {
        await client.setBucketVersioning(bucket, { Status: 'Enabled' });
      } catch (versioningError) {
        console.warn(`[MINIO] Failed to enable bucket versioning for '${bucket}':`, versioningError);
      }
    } else {
      await setMinIOCORSForClient();
      await applyPrivateBucketPolicy({
        bucket,
        client,
        warningMessage: `[MINIO] Failed to apply security policy to existing bucket '${bucket}':`,
      });
    }

    await client.listObjects(bucket, '', true);
    bucketInitialized = true;

    return {
      status: 'success',
      bucket,
      message: 'Bucket is ready for uploads',
      created: !exists,
    };
  } catch (error) {
    console.error(`[MINIO] Failed to initialize bucket '${bucket}':`, error);
    throw new Error(`Failed to initialize MinIO bucket: ${getMinioErrorMessage(error)}`);
  }
}

export async function initializeMinioClient({
  bucket,
  client,
}: {
  bucket: string;
  client: Minio;
}) {
  if (isMinioBuildPhase()) {
    return buildMinioSkippedResult('MinIO initialization skipped during build');
  }

  try {
    return await ensureMinioBucketExists({ bucket, client });
  } catch (error) {
    console.error('[MINIO] Failed to initialize MinIO:', error);
    throw error;
  }
}

export async function getMinioBucketInfo({
  bucket,
  client,
}: {
  bucket: string;
  client: Minio;
}) {
  if (isMinioBuildPhase()) {
    return {
      exists: true,
      bucket,
      message: 'Bucket info skipped during build',
    };
  }

  try {
    const exists = await client.bucketExists(bucket);
    if (!exists) {
      return {
        exists: false,
        bucket,
        message: 'Bucket does not exist',
      };
    }

    await client.listObjects(bucket, '', true);
    return {
      exists: true,
      bucket,
      message: 'Bucket is accessible and ready for use',
    };
  } catch (error) {
    console.error(`[MINIO] Error getting bucket info for '${bucket}':`, error);
    throw error;
  }
}

export async function checkMinioAvailability(client: Minio, bucket: string): Promise<boolean> {
  try {
    // Bucket-scoped S3 credentials commonly cannot list every bucket. A HEAD
    // request against the configured bucket verifies the access we actually use.
    await client.bucketExists(bucket);
    return true;
  } catch (error) {
    console.error('[MINIO] MinIO is not available:', error);
    return false;
  }
}
