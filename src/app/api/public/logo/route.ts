import { NextRequest, NextResponse } from 'next/server';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';

export const dynamic = 'force-dynamic';

function inferContentType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

/**
 * Public endpoint for login page logos - no authentication required
 * Only allows access to settings/logo images for security
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get('filePath') || '';

  if (!filePath) {
    return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
  }

  // Security: Only allow access to settings and logo images
  const normalizedPath = filePath.toLowerCase();
  const allowedPaths = ['settings/', 'applicant-source-logo/'];
  const isAllowed = allowedPaths.some(path => normalizedPath.startsWith(path));
  
  if (!isAllowed) {
    return NextResponse.json({ error: 'Forbidden: Only logo images are allowed' }, { status: 403 });
  }

  const contentType = inferContentType(filePath);
  const objectName = filePath;

  try {
    // Get object size for range handling
    const stat = await minioClient.statObject(MINIO_BUCKET, objectName);
    const size = stat.size ?? undefined;

    // Range support for large files
    const range = request.headers.get('range');
    if (range && size !== undefined) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : size - 1;
        const chunkSize = end - start + 1;
        const stream = await minioClient.getPartialObject(MINIO_BUCKET, objectName, start, chunkSize);
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Length', String(chunkSize));
        headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Content-Disposition', `inline; filename="${objectName.split('/').pop()}"`);
        return new NextResponse(stream as unknown as ReadableStream, { status: 206, headers });
      }
    }

    // Full object
    const stream = await minioClient.getObject(MINIO_BUCKET, objectName);
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    if (size !== undefined) {
      headers.set('Content-Length', String(size));
      headers.set('Accept-Ranges', 'bytes');
    }
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Content-Disposition', `inline; filename="${objectName.split('/').pop()}"`);
    return new NextResponse(stream as unknown as ReadableStream, { status: 200, headers });
  } catch (err) {
    console.error('[PUBLIC-LOGO] Error streaming object:', err);
    return NextResponse.json({ error: 'Failed to stream file' }, { status: 500 });
  }
}

