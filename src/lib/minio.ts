import { Client as Minio } from 'minio';

export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'uploads';
export const MINIO_PUBLIC_BASE_URL = process.env.MINIO_PUBLIC_BASE_URL || 'http://localhost:9000';

export const minioClient = new Minio({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
}); 