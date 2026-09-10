import { NextResponse, type NextRequest } from 'next/server';
import { MINIO_BUCKET, minioClient } from '@/lib/minio';
import {
  getPreviewFileName,
  getPreviewHeaders,
  inferPreviewContentType,
} from './secure-file-preview-headers';
import { buildResizedPreviewImageResponse } from './secure-file-preview-image';
import {
  isPreviewImage,
  shouldResizePreviewImage,
  type SecureFilePreviewRequest,
} from './secure-file-preview-request';

export type PreviewStreamContext = SecureFilePreviewRequest & {
  requestedBy: string;
};

function parseRangeHeader(range: string, size: number) {
  const match = /bytes=(\d+)-(\d*)/.exec(range);
  if (!match) {
    return null;
  }

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : size - 1;
  return { start, end, chunkSize: end - start + 1 };
}

export async function streamSecureFilePreview(request: NextRequest, context: PreviewStreamContext) {
  const objectName = context.filePath;
  const contentType = inferPreviewContentType(context.filePath);
  const shouldResize = shouldResizePreviewImage(context);
  const range = request.headers.get('range');

  const stat = await minioClient.statObject(MINIO_BUCKET, objectName);
  const size = stat.size ?? undefined;

  if (shouldResize) {
    return await buildResizedPreviewImageResponse(request, context);
  }

  if (range && size !== undefined) {
    const parsedRange = parseRangeHeader(range, size);
    if (parsedRange) {
      const stream = await minioClient.getPartialObject(
        MINIO_BUCKET,
        objectName,
        parsedRange.start,
        parsedRange.chunkSize
      );
      const headers = await getPreviewHeaders(
        contentType,
        getPreviewFileName(context.fileName, objectName),
        request
      );
      headers.set('Content-Length', String(parsedRange.chunkSize));
      headers.set('Content-Range', `bytes ${parsedRange.start}-${parsedRange.end}/${size}`);
      headers.set('Accept-Ranges', 'bytes');
      return new NextResponse(stream as unknown as ReadableStream, { status: 206, headers });
    }
  }

  const stream = await minioClient.getObject(MINIO_BUCKET, objectName);
  const headers = await getPreviewHeaders(
    contentType,
    getPreviewFileName(context.fileName, objectName),
    request
  );
  if (size !== undefined) {
    headers.set('Content-Length', String(size));
    headers.set('Accept-Ranges', 'bytes');
  }

  return new NextResponse(stream as unknown as ReadableStream, { status: 200, headers });
}

export function isPreviewNotFoundImage(context: PreviewStreamContext) {
  return isPreviewImage(context.filePath);
}
