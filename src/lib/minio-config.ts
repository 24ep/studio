import {
  buildStorageClientConfig,
  buildStorageSkippedResult,
  getStorageBucket,
  getStorageErrorMessage,
  getStoragePublicBaseUrl,
  isStorageBuildPhase,
  type StorageClientConfig,
  warnForInsecureProductionStorageConfig,
} from './storage-config';

export const MINIO_BUCKET = getStorageBucket();
export const MINIO_PUBLIC_BASE_URL = getStoragePublicBaseUrl();

export type MinioClientConfig = StorageClientConfig;

export function buildMinioClientConfig(): MinioClientConfig {
  return buildStorageClientConfig();
}

export function isMinioBuildPhase() {
  return isStorageBuildPhase();
}

export function buildMinioSkippedResult(message: string) {
  return buildStorageSkippedResult(message);
}

export function getMinioErrorMessage(error: unknown) {
  return getStorageErrorMessage(error);
}

export function warnForInsecureProductionMinioConfig() {
  warnForInsecureProductionStorageConfig();
}
