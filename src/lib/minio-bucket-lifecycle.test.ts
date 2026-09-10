import type { Client as Minio } from 'minio';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  checkMinioAvailability,
  ensureMinioBucketExists,
  getMinioBucketInfo,
} from './minio-bucket-lifecycle';

function minioClient(overrides: Partial<Minio>): Minio {
  return overrides as unknown as Minio;
}

describe('minio-bucket-lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports bucket info for missing and accessible buckets', async () => {
    await expect(getMinioBucketInfo({
      bucket: 'uploads',
      client: minioClient({
        bucketExists: vi.fn().mockResolvedValue(false),
      }),
    })).resolves.toEqual({
      exists: false,
      bucket: 'uploads',
      message: 'Bucket does not exist',
    });

    const listObjects = vi.fn().mockResolvedValue([]);
    await expect(getMinioBucketInfo({
      bucket: 'uploads',
      client: minioClient({
        bucketExists: vi.fn().mockResolvedValue(true),
        listObjects,
      }),
    })).resolves.toEqual({
      exists: true,
      bucket: 'uploads',
      message: 'Bucket is accessible and ready for use',
    });
    expect(listObjects).toHaveBeenCalledWith('uploads', '', true);
  });

  it('checks MinIO availability without throwing', async () => {
    const bucketExists = vi.fn().mockResolvedValue(true);
    await expect(checkMinioAvailability(minioClient({ bucketExists }), 'uploads')).resolves.toBe(true);
    expect(bucketExists).toHaveBeenCalledWith('uploads');

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(checkMinioAvailability(minioClient({
      bucketExists: vi.fn().mockRejectedValue(new Error('offline')),
    }), 'uploads')).resolves.toBe(false);
  });

  it('continues when bucket policy APIs are not implemented by the provider', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const listObjects = vi.fn().mockResolvedValue([]);

    await expect(ensureMinioBucketExists({
      bucket: 'uploads',
      client: minioClient({
        bucketExists: vi.fn().mockResolvedValue(true),
        listObjects,
        setBucketPolicy: vi.fn().mockRejectedValue({ code: 'NotImplemented' }),
      }),
    })).resolves.toMatchObject({
      status: 'success',
      bucket: 'uploads',
    });

    expect(listObjects).toHaveBeenCalledWith('uploads', '', true);
  });
});
