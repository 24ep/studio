import { afterEach, describe, expect, it, vi } from 'vitest';

describe('minio-config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('builds MinIO client config from environment with defaults', async () => {
    vi.stubEnv('MINIO_ENDPOINT', 'storage.local');
    vi.stubEnv('MINIO_PORT', '9443');
    vi.stubEnv('MINIO_USE_SSL', 'true');
    vi.stubEnv('MINIO_ACCESS_KEY', 'access');
    vi.stubEnv('MINIO_SECRET_KEY', 'secret');
    const { buildMinioClientConfig } = await import('./minio-config');

    expect(buildMinioClientConfig()).toEqual({
      accessKey: 'access',
      endPoint: 'storage.local',
      port: 9443,
      secretKey: 'secret',
      useSSL: true,
    });
  }, 15000);

  it('builds S3-compatible storage config from generic bucket settings', async () => {
    vi.stubEnv('STORAGE_ENDPOINT', 'https://s3.railway.app');
    vi.stubEnv('STORAGE_BUCKET', 'candidate-files');
    vi.stubEnv('STORAGE_ACCESS_KEY_ID', 'storage-access');
    vi.stubEnv('STORAGE_SECRET_ACCESS_KEY', 'storage-secret');
    vi.stubEnv('STORAGE_PUBLIC_BASE_URL', 'https://files.example.com');
    vi.stubEnv('STORAGE_PROVIDER', 'railway-s3');
    const { buildStorageConfig } = await import('./storage-config');

    expect(buildStorageConfig()).toEqual({
      accessKey: 'storage-access',
      bucket: 'candidate-files',
      endPoint: 's3.railway.app',
      port: 443,
      provider: 'railway-s3',
      publicBaseUrl: 'https://files.example.com',
      secretKey: 'storage-secret',
      signedUrlsInWebhooks: false,
      useSSL: true,
    });
  }, 15000);

  it('builds storage config from Railway bucket reference variables', async () => {
    vi.stubEnv('ENDPOINT', 'https://storage.railway.app');
    vi.stubEnv('BUCKET', 'tranquil-learning-bucket-t7t71n');
    vi.stubEnv('ACCESS_KEY_ID', 'railway-access');
    vi.stubEnv('SECRET_ACCESS_KEY', 'railway-secret');
    const { buildStorageConfig } = await import('./storage-config');

    expect(buildStorageConfig()).toMatchObject({
      accessKey: 'railway-access',
      bucket: 'tranquil-learning-bucket-t7t71n',
      endPoint: 'storage.railway.app',
      port: 443,
      secretKey: 'railway-secret',
      useSSL: true,
    });
  }, 15000);

  it('recognizes the bucket name exported by Railway CLI credentials', async () => {
    vi.stubEnv('AWS_S3_BUCKET_NAME', 'railway-cli-bucket');
    const { getStorageBucket } = await import('./storage-config');

    expect(getStorageBucket()).toBe('railway-cli-bucket');
  }, 15000);

  it('detects production build phase and formats skipped results', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    vi.stubEnv('MINIO_BUCKET_NAME', 'candidate-files');
    const {
      buildMinioSkippedResult,
      isMinioBuildPhase,
    } = await import('./minio-config');

    expect(isMinioBuildPhase()).toBe(true);
    expect(buildMinioSkippedResult('Skipped')).toEqual({
      status: 'success',
      bucket: 'candidate-files',
      message: 'Skipped',
      created: false,
    });
  }, 15000);

  it('warns about insecure production MinIO configuration', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MINIO_ENDPOINT', 'localhost');
    vi.stubEnv('MINIO_ACCESS_KEY', 'minioadmin');
    vi.stubEnv('MINIO_SECRET_KEY', 'minioadmin');
    vi.stubEnv('MINIO_PUBLIC_BASE_URL', 'http://localhost:9001');
    vi.stubEnv('USE_SIGNED_URLS_IN_WEBHOOKS', 'true');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { warnForInsecureProductionMinioConfig } = await import('./minio-config');

    warnForInsecureProductionMinioConfig();

    expect(consoleError).toHaveBeenCalledTimes(4);
  }, 15000);
});
