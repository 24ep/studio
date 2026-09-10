import { NextResponse, type NextRequest } from 'next/server';
import { MINIO_BUCKET } from '@/lib/minio';
import { buildTransparentMissingImageResponse } from './secure-file-preview-image';
import { isPreviewNotFoundImage, type PreviewStreamContext } from './secure-file-preview-stream';

export async function handleSecureFilePreviewStreamError(
  request: NextRequest,
  context: PreviewStreamContext,
  err: unknown
) {
  const error = err as { code?: string; message?: string };
  const errorCode = error?.code || 'Unknown';
  const errorMessage = error?.message || 'Unknown error';

  console.error('[SECURE-PREVIEW] Error streaming object:', {
    errorCode,
    errorMessage,
    objectName: context.filePath,
    bucket: MINIO_BUCKET,
    filePath: context.filePath,
    applicantId: context.applicantId || 'none',
    headcountId: context.headcountId || 'none',
    requestedBy: context.requestedBy || 'unknown',
    fullError: err,
  });

  if (errorCode === 'NotFound') {
    if (isPreviewNotFoundImage(context)) {
      return await buildTransparentMissingImageResponse(request, context.fileName, context.filePath);
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
