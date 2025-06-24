// src/app/api/setup/check-minio-bucket/route.ts
// This API route is no longer used as the setup page is being removed.
import { NextResponse } from 'next/server';
import { minioClient, MINIO_BUCKET, ensureBucketExists } from '@/lib/minio';

/**
 * @openapi
 * /api/setup/check-minio-bucket:
 *   get:
 *     summary: Check MinIO bucket connectivity and status
 *     responses:
 *       200:
 *         description: MinIO bucket status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 bucket:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: MinIO connection error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test MinIO connection and ensure bucket exists
    await ensureBucketExists();
    
    // Check if we can list objects (basic connectivity test)
    const objects = await minioClient.listObjects(MINIO_BUCKET, '', true);
    
    return NextResponse.json({ 
      status: 'success',
      bucket: MINIO_BUCKET,
      message: 'MinIO bucket is accessible and ready for uploads'
    });
  } catch (error) {
    console.error('MinIO bucket check error:', error);
    return NextResponse.json({ 
      status: 'error',
      error: 'Failed to connect to MinIO or access bucket',
      details: (error as Error).message
    }, { status: 500 });
  }
}
