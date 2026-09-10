import { NextResponse, type NextRequest } from 'next/server';

import { MINIO_BUCKET, minioClient } from '@/lib/minio';

export const dynamic = 'force-dynamic';

const PORTAL_ASSET_PATH = /^company-portal\/[a-zA-Z0-9-]+\.(gif|jpe?g|png|webp)$/;

const CONTENT_TYPES: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('filePath') || '';
  const match = PORTAL_ASSET_PATH.exec(filePath);

  if (!match) {
    return NextResponse.json({ error: 'Invalid portal asset path' }, { status: 400 });
  }

  try {
    const stat = await minioClient.statObject(MINIO_BUCKET, filePath);
    const stream = await minioClient.getObject(MINIO_BUCKET, filePath);
    const fileName = filePath.split('/').pop() || 'portal-image';
    const headers = new Headers({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Type': CONTENT_TYPES[match[1].toLowerCase()] || 'application/octet-stream',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
    });

    if (stat.size !== undefined) {
      headers.set('Content-Length', String(stat.size));
    }

    return new NextResponse(stream as unknown as ReadableStream, { headers });
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';
    if (code === 'NoSuchKey' || code === 'NotFound') {
      return NextResponse.json({ error: 'Portal image not found' }, { status: 404 });
    }

    console.error('[PUBLIC-COMPANY-PORTAL-ASSET] Stream failed:', error);
    return NextResponse.json({ error: 'Failed to load portal image' }, { status: 500 });
  }
}
