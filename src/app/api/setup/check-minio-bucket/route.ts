// src/app/api/setup/check-minio-bucket/route.ts
// This API route is no longer used as the setup page is being removed.
import { NextResponse } from 'next/server';
import { initializeMinIO, getBucketInfo } from '@/lib/minio';

/**
 * @openapi
 * /api/setup/check-minio-bucket:
 *   get:
 *     summary: Check MinIO bucket connectivity and status
 *     description: Checks MinIO connection and automatically creates bucket if it doesn't exist
 *     tags: ['Setup'],
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
 *                   enum: ['success', 'error']
 *                 bucket:
 *                   type: string
 *                 message:
 *                   type: string
 *                 created:
 *                   type: boolean
 *                   description: Whether the bucket was created during this check
 *       500:
 *         description: MinIO connection error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['error']
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log('🔍 Checking MinIO bucket status...');
    
    // Initialize MinIO (this will create bucket if it doesn't exist)
    const result = await initializeMinIO();
    
    console.log('✅ MinIO bucket check completed successfully');
    
    return NextResponse.json({
      status: 'success',
      bucket: result.bucket,
      message: result.message,
      created: result.created || false
    });
    
  } catch (error) {
    console.error('❌ MinIO bucket check failed:', error);
    
    let errorMessage = 'Failed to connect to MinIO or access bucket';
    let details = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      details = error.stack || '';
    }
    
    return NextResponse.json({ 
      status: 'error',
      error: errorMessage,
      details: details
    }, { status: 500 });
  }
}

// POST endpoint to force bucket creation/initialization
export async function POST() {
  try {
    console.log('🚀 Force initializing MinIO bucket...');
    
    // Force initialization
    const result = await initializeMinIO();
    
    console.log('✅ MinIO bucket initialization completed');
    
    return NextResponse.json({
      status: 'success',
      bucket: result.bucket,
      message: 'MinIO bucket initialized successfully',
      created: result.created || false
    });
    
  } catch (error) {
    console.error('❌ MinIO bucket initialization failed:', error);
    
    let errorMessage = 'Failed to initialize MinIO bucket';
    let details = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      details = error.stack || '';
    }
    
    return NextResponse.json({ 
      status: 'error',
      error: errorMessage,
      details: details
    }, { status: 500 });
  }
}
