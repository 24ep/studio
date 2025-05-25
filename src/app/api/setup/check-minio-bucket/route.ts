
// src/app/api/setup/check-minio-bucket/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { minioClient, MINIO_BUCKET_NAME } from '@/lib/minio';
import { logAudit } from '@/lib/auditLog';

export async function GET(request: NextRequest) {
  try {
    const bucketExists = await minioClient.bucketExists(MINIO_BUCKET_NAME);
    if (bucketExists) {
      await logAudit('AUDIT', `MinIO bucket '${MINIO_BUCKET_NAME}' check: Exists.`, 'API:Setup', null, { bucketName: MINIO_BUCKET_NAME, status: 'exists' });
      return NextResponse.json(
        { status: 'ok', message: `MinIO bucket "${MINIO_BUCKET_NAME}" exists and is accessible.` },
        { status: 200 }
      );
    } else {
      await logAudit('WARN', `MinIO bucket '${MINIO_BUCKET_NAME}' check: Does not exist.`, 'API:Setup', null, { bucketName: MINIO_BUCKET_NAME, status: 'not_found' });
      return NextResponse.json(
        { status: 'error', message: `MinIO bucket "${MINIO_BUCKET_NAME}" does not exist. Application will attempt to auto-create it.` },
        { status: 404 } // Using 404 for not found seems appropriate
      );
    }
  } catch (error: any) {
    console.error('Error checking MinIO bucket status:', error);
    let errorMessage = `Failed to check MinIO bucket status: ${error.message || 'Unknown MinIO error'}`;
    if (error.code === 'ECONNREFUSED') {
        errorMessage = `Failed to connect to MinIO server at ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}. Ensure MinIO is running and accessible.`;
    } else if (error.code === 'S3Error' && error.message.includes('Access Denied')) {
        errorMessage = `Access Denied when trying to check MinIO bucket. Verify MinIO credentials (Access Key/Secret Key).`;
    }
    await logAudit('ERROR', `MinIO bucket check for '${MINIO_BUCKET_NAME}' failed. Error: ${errorMessage}.`, 'API:Setup', null, { bucketName: MINIO_BUCKET_NAME, error: error.message });
    return NextResponse.json(
      { status: 'error', message: errorMessage },
      { status: 500 }
    );
  }
}

    