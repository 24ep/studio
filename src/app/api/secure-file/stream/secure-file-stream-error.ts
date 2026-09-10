import { NextResponse, type NextRequest } from 'next/server';
import { MINIO_BUCKET } from '@/lib/minio';
import { buildTransparentMissingStreamImageResponse } from './secure-file-stream-image';
import { isStreamImage, type SecureFileStreamRequest } from './secure-file-stream-request';

export async function handleSecureFileStreamError({
  request,
  context,
  requestedBy,
  err,
}: {
  request: NextRequest;
  context: SecureFileStreamRequest;
  requestedBy: string;
  err: unknown;
}) {
  const error = err as { code?: string; message?: string };
  const errorCode = error?.code || 'Unknown';
  const errorMessage = error?.message || 'Unknown error';

  console.error('[SECURE-STREAM] Error streaming object:', {
    errorCode,
    errorMessage,
    objectName: context.filePath,
    bucket: MINIO_BUCKET,
    filePath: context.filePath,
    applicantId: context.applicantId || 'none',
    headcountId: context.headcountId || 'none',
    requestedBy,
    fullError: err,
  });

  if (errorCode === 'NotFound') {
    if (isStreamImage(context.filePath)) {
      return await buildTransparentMissingStreamImageResponse(request);
    }

    return NextResponse.json({
      error: 'File not found',
      details: `The file "${context.filePath}" does not exist in storage`,
      code: 'FILE_NOT_FOUND',
    }, { status: 404 });
  }

  return NextResponse.json({
    error: 'Failed to stream file',
    details: errorMessage,
    code: errorCode,
  }, { status: 500 });
}
