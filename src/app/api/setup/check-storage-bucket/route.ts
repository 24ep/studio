import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getBucketInfo, startupStorageInitialization } from '@/lib/storage-service';

import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/setup/check-storage-bucket:
 *   get:
 *     summary: Check object storage bucket status
 *     description: Tests S3-compatible storage connectivity and bucket access
 *     responses:
 *       200:
 *         description: Object storage bucket status
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

    if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const initResult = await startupStorageInitialization();

    if (initResult.status === 'error') {
      console.error('[STORAGE CHECK] Storage initialization failed:', initResult);
      return NextResponse.json({
        status: 'error',
        message: initResult.message,
        bucket: initResult.bucket,
        error: 'error' in initResult ? initResult.error : 'Unknown error',
      });
    }

    try {
      const bucketInfo = await getBucketInfo();

      return NextResponse.json({
        status: bucketInfo.exists ? 'success' : 'warning',
        message: bucketInfo.message,
        bucket: bucketInfo.bucket,
      });
    } catch (error) {
      console.error('[STORAGE CHECK] Failed to get bucket info:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to get bucket information',
        bucket: initResult.bucket || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } catch (error) {
    console.error('[STORAGE CHECK] Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error during storage check',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
