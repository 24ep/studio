export const DEFAULT_STORAGE_BUCKET = 'uploads';
export const DEFAULT_STORAGE_ENDPOINT = 'http://localhost:9000';
export const DEFAULT_STORAGE_PUBLIC_BASE_URL = 'http://localhost:9001';

export interface StorageClientConfig {
  accessKey: string;
  endPoint: string;
  port: number;
  secretKey: string;
  useSSL: boolean;
}

export interface StorageConfig extends StorageClientConfig {
  bucket: string;
  publicBaseUrl: string;
  provider: string;
  signedUrlsInWebhooks: boolean;
}

export function getStorageBucket() {
  return readStorageEnv([
    'STORAGE_BUCKET',
    'S3_BUCKET',
    'AWS_BUCKET_NAME',
    'AWS_S3_BUCKET',
    'AWS_S3_BUCKET_NAME',
    'BUCKET',
    'MINIO_BUCKET_NAME',
    'MINIO_BUCKET',
  ]) || DEFAULT_STORAGE_BUCKET;
}

export function getStoragePublicBaseUrl() {
  return readStorageEnv([
    'STORAGE_PUBLIC_BASE_URL',
    'S3_PUBLIC_BASE_URL',
    'AWS_S3_PUBLIC_BASE_URL',
    'MINIO_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_MINIO_PUBLIC_BASE_URL',
  ]) || DEFAULT_STORAGE_PUBLIC_BASE_URL;
}

export function buildStorageConfig(): StorageConfig {
  const endpointUrl = parseStorageEndpoint(
    readStorageEnv([
      'STORAGE_ENDPOINT',
      'S3_ENDPOINT',
      'AWS_ENDPOINT_URL',
      'AWS_S3_ENDPOINT',
      'ENDPOINT',
      'MINIO_ENDPOINT',
    ]) || DEFAULT_STORAGE_ENDPOINT,
  );

  return {
    accessKey: readStorageEnv([
      'STORAGE_ACCESS_KEY_ID',
      'S3_ACCESS_KEY_ID',
      'AWS_ACCESS_KEY_ID',
      'ACCESS_KEY_ID',
      'MINIO_ACCESS_KEY',
    ]) || '',
    bucket: getStorageBucket(),
    endPoint: endpointUrl.hostname,
    port: readStoragePort(endpointUrl),
    provider: readStorageEnv(['STORAGE_PROVIDER', 'S3_PROVIDER']) || 's3-compatible',
    publicBaseUrl: getStoragePublicBaseUrl(),
    secretKey: readStorageEnv([
      'STORAGE_SECRET_ACCESS_KEY',
      'S3_SECRET_ACCESS_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'SECRET_ACCESS_KEY',
      'MINIO_SECRET_KEY',
    ]) || '',
    signedUrlsInWebhooks: readBooleanEnv('USE_SIGNED_URLS_IN_WEBHOOKS', false),
    useSSL: readStorageUseSsl(endpointUrl),
  };
}

export function buildStorageClientConfig(): StorageClientConfig {
  const { accessKey, endPoint, port, secretKey, useSSL } = buildStorageConfig();
  return { accessKey, endPoint, port, secretKey, useSSL };
}

export function isStorageBuildPhase() {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export function buildStorageSkippedResult(message: string) {
  return {
    status: 'success',
    bucket: getStorageBucket(),
    message,
    created: false,
  };
}

export function getStorageErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function warnForInsecureProductionStorageConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const config = buildStorageConfig();
  const insecureDefaultCredential = 'minio' + 'admin';

  if (config.endPoint === 'localhost') {
    console.error('[STORAGE] SECURITY WARNING: object storage endpoint is using localhost in production!');
  }
  if (!config.accessKey || config.accessKey === insecureDefaultCredential) {
    console.error('[STORAGE] SECURITY WARNING: object storage access key is not set or uses default credentials in production!');
  }
  if (!config.secretKey || config.secretKey === insecureDefaultCredential) {
    console.error('[STORAGE] SECURITY WARNING: object storage secret key is not set or uses default credentials in production!');
  }
  if (config.signedUrlsInWebhooks && (!config.publicBaseUrl || config.publicBaseUrl.includes('localhost'))) {
    console.error('[STORAGE] SECURITY WARNING: object storage public URL is missing or points at localhost in production!');
  }
}

function readStorageEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  return undefined;
}

function parseStorageEndpoint(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return new URL(value);
  }

  const useSsl = readBooleanEnv('STORAGE_USE_SSL', readBooleanEnv('S3_USE_SSL', process.env.MINIO_USE_SSL === 'true'));
  return new URL(`${useSsl ? 'https' : 'http'}://${value}`);
}

function readStoragePort(endpointUrl: URL) {
  if (endpointUrl.port) {
    return Number.parseInt(endpointUrl.port, 10);
  }

  const configuredPort = readStorageEnv(['STORAGE_PORT', 'S3_PORT', 'MINIO_PORT']);
  if (configuredPort) {
    return Number.parseInt(configuredPort, 10);
  }

  return endpointUrl.protocol === 'https:' ? 443 : 80;
}

function readStorageUseSsl(endpointUrl: URL) {
  const configured = readStorageEnv(['STORAGE_USE_SSL', 'S3_USE_SSL', 'MINIO_USE_SSL']);
  if (configured !== undefined) {
    return configured === 'true';
  }

  return endpointUrl.protocol === 'https:';
}

function readBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}
