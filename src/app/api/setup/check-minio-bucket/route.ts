import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getBucketInfo, startupMinIOInitialization } from '@/lib/minio';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';


/**
 * @openapi
 * /api/setup/check-minio-bucket:
 *   get:
 *     summary: Check MinIO bucket status
 *     description: Tests MinIO connectivity and bucket access
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
 *                   enum: ['success', 'warning', 'error']
 *                 message:
 *                   type: string
 *                 bucket:
 *                   type: string
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

  
    // Try to initialize MinIO
    const initResult = await startupMinIOInitialization();
    
    if (initResult.status === 'error') {
      console.error('[MINIO CHECK] MinIO initialization failed:', initResult);
      return NextResponse.json({
        status: 'error',
        message: initResult.message,
        bucket: initResult.bucket,
        error: 'error' in initResult ? initResult.error : 'Unknown error'
      });
    }

    // Get detailed bucket info
    try {
      const bucketInfo = await getBucketInfo();

      return NextResponse.json({
        status: bucketInfo.exists ? 'success' : 'warning',
        message: bucketInfo.message,
        bucket: bucketInfo.bucket
      });
    } catch (error) {
      console.error('[MINIO CHECK] Failed to get bucket info:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to get bucket information',
        bucket: initResult.bucket || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('[MINIO CHECK] Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error during MinIO check',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
