import { NextResponse, type NextRequest } from 'next/server';
import {
  addStreamCorsHeaders,
  setNoStoreHeaders,
} from './secure-file-stream-headers';

export async function buildTransparentMissingStreamImageResponse(request: NextRequest) {
  const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const headers = new Headers();
  headers.set('Content-Type', 'image/png');
  headers.set('Content-Length', String(transparentPng.length));
  setNoStoreHeaders(headers);
  headers.set('X-File-Status', 'not-found');
  await addStreamCorsHeaders(headers, request);

  return new NextResponse(transparentPng, { status: 200, headers });
}
