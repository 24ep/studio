import * as Minio from 'minio';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minio_secret_password';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error('MinIO environment variables (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY) not fully configured for production!');
    // In a strictly configured production environment, you might throw an error here
    // to prevent the application from starting without proper MinIO configuration.
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

// Helper function to ensure bucket exists
// Call this during application startup or before the first upload attempt.
export async function ensureBucketExists(bucketName: string = MINIO_BUCKET_NAME, region: string = 'us-east-1') {
  try {
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, region); // MinIO makeBucket often requires a region string, though it might be ignored by some S3-compat services
      console.log(`Bucket \${bucketName} created successfully in region \${region}.`);
      // Optionally set a bucket policy if needed, e.g., for public read access on uploaded files.
      // const policy = { ... }; // define your policy
      // await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    }
  } catch (err) {
    console.error(`Error during MinIO bucket check/creation for \${bucketName}:`, err);
    // Depending on your error handling strategy, you might re-throw or handle this.
    // For production, ensure robust error handling and logging.
  }
}
