import { getStorageBucket, getStoragePublicBaseUrl } from './storage-config';

// Compatibility exports for existing MinIO-named call sites.
export const MINIO_BUCKET = getStorageBucket();
export const MINIO_PUBLIC_BASE_URL = getStoragePublicBaseUrl();

