import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { minioClient, MINIO_BUCKET, ensureBucketExists, MINIO_PUBLIC_BASE_URL } from '@/lib/minio';
import { Buffer } from 'buffer';

import { auth } from '@/auth';
export const maxDuration = 300; // 5 minutes timeout
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  const session = await auth();
  
  try {
    // Only allow Admin or SYSTEM_SETTINGS_EDIT
    if (!session?.user || !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
      await logAudit('WARN', `Forbidden attempt to upload settings image by user ${session?.user?.email || 'Unknown'}.`, 'API:SystemSettings:UploadImage', session?.user?.id);
      return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!(file as File).type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    
    // Validate file size using standardized limit
    const { securityConfig } = await import('@/lib/securityConfig');
    const maxSize = securityConfig.fileUpload.maxImageSize; // 5MB for images
    if ((file as File).size > maxSize) {
      console.error('[SETTINGS UPLOAD] File too large:', (file as File).size);
      return NextResponse.json({ error: `File size must be less than ${maxSize / (1024 * 1024)}MB` }, { status: 400 });
    }

    // Ensure MinIO bucket exists with private access only
    try {
      await ensureBucketExists();
      
      // SECURITY: Never set public read access - all files must be accessed via signed URLs
      // console.log('[SETTINGS UPLOAD] ? SECURITY: Files uploaded with private access only');
    } catch (minioError) {
      console.error('[SETTINGS UPLOAD] MinIO bucket error:', minioError);
      await logAudit('ERROR', `Settings image upload failed - MinIO bucket error: ${minioError}`, 'API:SystemSettings:UploadImage', session?.user?.id);
      return NextResponse.json({ message: 'Storage service unavailable' }, { status: 503 });
    }

    const ext = (file as File).name.split('.').pop();
    // SECURITY: Use cryptographically secure random for filename generation
    const { generateSecureFilename } = await import('@/lib/cryptoUtils');
    const objectName = `settings/${Date.now()}-${generateSecureFilename(12)}.${ext}`;
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    await getPool(); // Ensure DB pool is initialized (if needed for MinIO)
    await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': (file as File).type,
      // Add CORS headers for COEP compliance
      'Cross-Origin-Resource-Policy': 'cross-origin'
      // Note: CORS headers are set in HTTP response, not MinIO metadata
    });
    // ?? SECURITY: Return web application URL instead of direct MinIO URL
    // Use preview endpoint for images displayed in img tags
    const webAppUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:8021'}/api/secure-file/preview?filePath=${encodeURIComponent(objectName)}`;
    
    // SECURITY: Use proper CORS validation instead of wildcard
    const { getAllowedOrigin } = await import('@/lib/cors');
    const allowedOrigin = getAllowedOrigin(request);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    // Return response with proper headers
    return NextResponse.json(
      { url: webAppUrl },
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('[SETTINGS UPLOAD] Unexpected error:', error);
    await logAudit('ERROR', `Settings image upload failed - Unexpected error: ${error}`, 'API:SystemSettings:UploadImage', session?.user?.id);
    return NextResponse.json(
      { message: 'Internal server error during upload' },
      { status: 500 }
    );
  }
} 
