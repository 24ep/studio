import { NextResponse } from 'next/server';
import type { DownloadRouteRequestContext } from './download-route-request';

export function resolveDownloadFileName(context: DownloadRouteRequestContext) {
  let finalFileName = context.fileName || 'downloaded-file';

  if (!context.fileName && context.filePath) {
    const pathParts = context.filePath.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      finalFileName = lastPart;
    }
  }

  return sanitizeDownloadFileName(finalFileName);
}

export function sanitizeDownloadFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function createDownloadResponse({
  buffer,
  contentType,
  fileName,
}: {
  buffer: ArrayBuffer;
  contentType: string;
  fileName: string;
}) {
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename = "${fileName}"`,
      'Content-Length': buffer.byteLength.toString(),
      'Cache-Control': 'no-cache',
      'X-Download-Source': 'Studio-Download-API',
    },
  });
}
