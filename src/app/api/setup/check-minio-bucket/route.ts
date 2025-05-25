
// src/app/api/setup/check-minio-bucket/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserProfile } from '@/lib/types';
import { minioClient, MINIO_BUCKET_NAME } from '@/lib/minio';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as UserProfile).role !== 'Admin') {
    return NextResponse.json({ message: 'Forbidden: Only Admins can perform this check.' }, { status: 403 });
  }

  try {
    const bucketExists = await minioClient.bucketExists(MINIO_BUCKET_NAME);
    if (bucketExists) {
      return NextResponse.json(
        { status: 'ok', message: `MinIO bucket "${MINIO_BUCKET_NAME}" exists and is accessible.` },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { status: 'error', message: `MinIO bucket "${MINIO_BUCKET_NAME}" does not exist.` },
        { status: 404 } // Or 200 with an error status, depending on preference
      );
    }
  } catch (error: any) {
    console.error('Error checking MinIO bucket status:', error);
    // Check for common MinIO connection errors if possible, though error structure varies
    let errorMessage = `Failed to check MinIO bucket status: ${error.message || 'Unknown MinIO error'}`;
    if (error.code === 'ECONNREFUSED') {
        errorMessage = `Failed to connect to MinIO server at ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}. Ensure MinIO is running and accessible.`;
    } else if (error.code === 'S3Error' && error.message.includes('Access Denied')) {
        errorMessage = `Access Denied when trying to check MinIO bucket. Verify MinIO credentials (Access Key/Secret Key).`;
    }
    
    return NextResponse.json(
      { status: 'error', message: errorMessage },
      { status: 500 }
    );
  }
}
