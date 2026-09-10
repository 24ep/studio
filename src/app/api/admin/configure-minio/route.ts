export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { minioClient, MINIO_BUCKET, setMinIOCORS } from '@/lib/minio';

export async function POST(request: NextRequest) {
  const session = await auth();

  // Only allow admin users to configure MinIO
  if (session?.user?.role !== 'Admin') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  try {
    // MinIO CORS is now configured via environment variables or mc admin config.
    await setMinIOCORS();

    return NextResponse.json({
      success: true,
      message:
        'Object storage CORS is managed via provider configuration (for MinIO-compatible services, use MINIO_API_CORS_* environment variables).',
      configuredAtRuntime: false,
      bucket: MINIO_BUCKET,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error configuring MinIO CORS:', error);
    return NextResponse.json(
      {
        error: 'Failed to configure MinIO CORS',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();

  // Only allow admin users to view MinIO configuration
  if (session?.user?.role !== 'Admin') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  try {
    // Get bucket policy
    let bucketPolicy = null;
    try {
      bucketPolicy = await minioClient.getBucketPolicy(MINIO_BUCKET);
    } catch (error) {
      console.warn('Could not retrieve bucket policy:', error);
    }

    return NextResponse.json({
      bucket: MINIO_BUCKET,
      bucketPolicy: bucketPolicy ? JSON.parse(bucketPolicy) : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error retrieving MinIO configuration:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve MinIO configuration',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
