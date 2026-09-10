import { NextResponse, type NextRequest } from 'next/server';

const STREAM_CORS_HEADERS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
};

export function inferStreamContentType(filePath: string): string {
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

export async function handleStreamOptions(request: NextRequest) {
  const { getAllowedOrigin } = await import('@/lib/cors');
  const allowedOrigin = getAllowedOrigin(request);

  if (!allowedOrigin) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      ...STREAM_CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function buildStreamHeaders({
  request,
  contentType,
  fileName,
  objectName,
  size,
}: {
  request: NextRequest;
  contentType: string;
  fileName: string | undefined;
  objectName: string;
  size?: number;
}) {
  const headers = new Headers();
  headers.set('Content-Type', contentType);
  if (size !== undefined) {
    headers.set('Content-Length', String(size));
    headers.set('Accept-Ranges', 'bytes');
  }
  setNoStoreHeaders(headers);
  await addStreamCorsHeaders(headers, request);
  headers.set('Content-Disposition', `inline; filename="${getStreamFileName(fileName, objectName)}"`);
  return headers;
}

export async function addStreamCorsHeaders(headers: Headers, request: NextRequest) {
  const { getAllowedOrigin } = await import('@/lib/cors');
  const allowedOrigin = getAllowedOrigin(request);

  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    Object.entries(STREAM_CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  }
}

export function setNoStoreHeaders(headers: Headers) {
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
}

export function getStreamFileName(fileName: string | undefined, objectName: string) {
  return (fileName || objectName).split('/').pop() || 'file';
}
