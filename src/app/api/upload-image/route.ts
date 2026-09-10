import { NextRequest, NextResponse } from 'next/server';
import { minioClient, ensureBucketExists, MINIO_BUCKET, MINIO_PUBLIC_BASE_URL } from '@/lib/minio';
import { randomUUID } from 'crypto';
import { sanitizeFilename } from '@/lib/fileUtils';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    // Handle both 'file' and 'image' field names for backward compatibility
    const file = (formData.get('file') || formData.get('image')) as File;
    const type = formData.get('type') as string;
    
    if (!file) {
      console.error('[UPLOAD-IMAGE] No file found in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[UPLOAD-IMAGE] Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size using standardized limit
    const { securityConfig } = await import('@/lib/securityConfig');
    const maxSize = securityConfig.fileUpload.maxImageSize; // 5MB for images
    if (file.size > maxSize) {
      console.error('[UPLOAD-IMAGE] File too large:', file.size);
      return NextResponse.json(
        { error: `File size must be less than ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Ensure MinIO bucket exists with private access only
    try {
      await ensureBucketExists();
      
      // SECURITY: Never set public read access - all files must be accessed via signed URLs
      // console.log('[UPLOAD-IMAGE] ? SECURITY: Files uploaded with private access only');
    } catch (minioError) {
      console.error('[UPLOAD-IMAGE] MinIO bucket error:', minioError);
      return NextResponse.json(
        { error: 'Storage service unavailable' },
        { status: 503 }
      );
    }

    // Generate unique filename with timestamp for cache busting
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    let objectName: string;
    
    if (type === 'Applicant-source-logo') {
      objectName = `Applicant-source-logo/${timestamp}-${randomUUID()}.${extension}`;
    } else if (type === 'app-logo' || type === 'settings') {
      objectName = `settings/${timestamp}-${randomUUID()}.${extension}`;
    } else {
      objectName = `profile-images/${timestamp}-${randomUUID()}.${extension}`;
    }
    
    // console.log('[UPLOAD-IMAGE] Uploading to MinIO:', objectName);

    // Convert file to buffer and upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer());
    await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': file.type,
      'x-amz-meta-originalname': sanitizeFilename(file.name),
      'x-amz-meta-uploaded-by': session.user.id,
      'x-amz-meta-upload-date': new Date().toISOString(),
      // Add cache control headers to prevent caching
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      // Add CORS headers for COEP compliance
      'Cross-Origin-Resource-Policy': 'cross-origin'
      // Note: CORS headers are set in HTTP response, not MinIO metadata
    });

    // ?? SECURITY: Return web application URL instead of direct MinIO URL
    // Use preview endpoint for images displayed in img tags
    const webAppUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:8021'}/api/secure-file/preview?filePath=${encodeURIComponent(objectName)}`;
    // console.log('[UPLOAD-IMAGE] File uploaded successfully:', webAppUrl);

    // Create response with cache-busting headers
    const response = NextResponse.json({
      success: true,
      file: {
        url: webAppUrl,
        filename: file.name,
        size: file.size,
        type: file.type
      },
      url: webAppUrl, // For backward compatibility
      filename: file.name,
      size: file.size,
      type: file.type
    });

    // Add cache-busting headers to prevent browser caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // SECURITY: Use proper CORS validation instead of wildcard
    const { getAllowedOrigin } = await import('@/lib/cors');
    const allowedOrigin = getAllowedOrigin(request);
    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;

  } catch (error) {
    console.error('[UPLOAD-IMAGE] Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
} 
