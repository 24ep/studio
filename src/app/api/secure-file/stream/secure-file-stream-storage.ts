import { NextResponse, type NextRequest } from 'next/server';
import { MINIO_BUCKET, minioClient } from '@/lib/minio';
import {
  buildStreamHeaders,
  inferStreamContentType,
} from './secure-file-stream-headers';
import { parseStreamRangeHeader } from './secure-file-stream-request';

export type SecureFileStreamContext = {
  filePath: string;
  fileName: string | undefined;
};

export async function streamSecureFileObject(request: NextRequest, context: SecureFileStreamContext) {
  const objectName = context.filePath;
  const contentType = inferStreamContentType(context.filePath);
  const range = request.headers.get('range');
  const stat = await minioClient.statObject(MINIO_BUCKET, objectName);
  const size = stat.size ?? undefined;

  if (range && size !== undefined) {
    const parsedRange = parseStreamRangeHeader(range, size);
    if (parsedRange) {
      const stream = await minioClient.getPartialObject(
        MINIO_BUCKET,
        objectName,
        parsedRange.start,
        parsedRange.chunkSize
      );
      const headers = await buildStreamHeaders({
        request,
        contentType,
        fileName: context.fileName,
        objectName,
        size: parsedRange.chunkSize,
      });
      headers.set('Content-Range', `bytes ${parsedRange.start}-${parsedRange.end}/${size}`);
      return new NextResponse(stream as unknown as ReadableStream, { status: 206, headers });
    }
  }

  const stream = await minioClient.getObject(MINIO_BUCKET, objectName);
  const headers = await buildStreamHeaders({
    request,
    contentType,
    fileName: context.fileName,
    objectName,
    size,
  });
  return new NextResponse(stream as unknown as ReadableStream, { status: 200, headers });
}
