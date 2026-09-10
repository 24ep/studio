import { type NextRequest, NextResponse } from 'next/server';

export function inferPreviewContentType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

export async function handlePreviewOptions(request: NextRequest) {
  const { getAllowedOrigin } = await import('@/lib/cors');
  const allowedOrigin = getAllowedOrigin(request);

  if (!allowedOrigin) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function getPreviewHeaders(contentType: string, fileName: string, request: NextRequest) {
  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Content-Disposition', `inline; filename="${fileName}"`);

  const { getAllowedOrigin } = await import('@/lib/cors');
  const allowedOrigin = getAllowedOrigin(request);
  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  headers.set('Content-Security-Policy', "frame-ancestors 'self'");
  return headers;
}

export function getPreviewFileName(fileName: string | undefined, objectName: string) {
  return (fileName || objectName).split('/').pop() || 'file';
}
