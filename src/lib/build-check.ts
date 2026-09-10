/**
 * Utility functions to handle build-time vs runtime environment differences
 */

import { buildStorageConfig, DEFAULT_STORAGE_BUCKET, DEFAULT_STORAGE_ENDPOINT } from './storage-config';

export const isBuildTime = () => {
  // Check if we're in a build context
  // During Docker build, DATABASE_URL is set to a dummy value
  // At runtime, DATABASE_URL will be the actual database connection string
  if (process.env.DATABASE_URL?.includes('dummy')) {
    return true; // We're in build phase (dummy DATABASE_URL)
  }

  // Also check Next.js build phase (set automatically by Next.js during builds)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    // But if we have a real DATABASE_URL, we're actually running, not building
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')) {
      return false; // We have a real database URL, so we're running
    }
    return true; // We're in build phase
  }

  return false; // Not in build phase
};

export const isRuntime = () => {
  return !isBuildTime();
};

export const getBuildSafeConfig = () => {
  if (isBuildTime()) {
    return {
      storage: {
        endpoint: DEFAULT_STORAGE_ENDPOINT,
        bucket: DEFAULT_STORAGE_BUCKET,
        accessKeyConfigured: Boolean(process.env.STORAGE_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY),
      },
      redis: {
        url: 'redis://redis:6379'
      },
      database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:secure_password@postgres:8521/studio_production'
      }
    };
  }

  const storage = buildStorageConfig();

  return {
    storage: {
      endpoint: `${storage.useSSL ? 'https' : 'http'}://${storage.endPoint}:${storage.port}`,
      bucket: storage.bucket,
      provider: storage.provider,
      accessKeyConfigured: Boolean(storage.accessKey),
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://redis:6379'
    },
    database: {
      url: process.env.DATABASE_URL || ''
    }
  };
};

export const logBuildSafe = (message: string, data?: unknown) => {
  if (isBuildTime()) {

  }
}; 
