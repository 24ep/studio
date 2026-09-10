import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { enforcePrivateBucketPolicy, MINIO_BUCKET } from '@/lib/minio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  // Only allow admin users to secure the bucket
  if (session?.user?.role !== 'Admin') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  try {
    console.log('SECURITY FIX: Enforcing private bucket policy...');
    
    // Enforce private bucket policy
    await enforcePrivateBucketPolicy();
    
    return NextResponse.json({
      success: true,
      message: 'SECURITY FIX APPLIED: Bucket is now private and requires authentication',
      bucket: MINIO_BUCKET,
      timestamp: new Date().toISOString(),
      securityStatus: 'SECURED'
    });
    
  } catch (error) {
    console.error('Error securing bucket:', error);
    return NextResponse.json(
      { 
        error: 'Failed to secure bucket',
        message: error instanceof Error ? error.message : String(error),
        securityStatus: 'FAILED'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  
  // Only allow admin users to check bucket security
  if (session?.user?.role !== 'Admin') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Bucket security endpoint - use POST to enforce private access',
    bucket: MINIO_BUCKET,
    securityEndpoint: '/api/admin/secure-bucket',
    method: 'POST'
  });
}
