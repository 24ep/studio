
import * as Minio from 'minio';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minio_secret_password';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: MinIO environment variables (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY) not fully configured for production!');
  } else {
    console.warn('MinIO environment variables not fully configured. Using defaults for development. Ensure these are set for production.');
  }
}

export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

export const MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'canditrack-resumes';

export async function ensureBucketExists(bucketName: string = MINIO_BUCKET_NAME, region: string = 'us-east-1') {
  try {
    // First, try a simple health check by listing buckets (requires listBuckets permission)
    // This can help catch immediate connectivity or credential issues.
    await minioClient.listBuckets(); 
    console.log('Successfully connected to MinIO server.');

    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, region);
      console.log(`MinIO: Bucket ${bucketName} created successfully in region ${region}.`);
    } else {
      console.log(`MinIO: Bucket ${bucketName} already exists.`);
    }
  } catch (err: any) {
    console.error(`MinIO Error: Failed to connect or ensure bucket ${bucketName} exists.`);
    console.error(`MinIO Error Details: ${(err as Error).message}`);
    // Depending on severity, you might want to handle this more strictly in production
    // process.exit(1);
  }
}

// Startup check is now handled on-demand by the application logic (e.g., in /api/resumes/upload)
// This prevents blocking the server startup for faster initial load times.
// ensureBucketExists(); // This blocking call was removed.
