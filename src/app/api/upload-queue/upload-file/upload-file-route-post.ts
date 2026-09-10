import { NextRequest, NextResponse } from 'next/server';

import { ensureBucketExists } from '@/lib/minio';
import { authorizeUploadRequest } from './upload-file-route-auth';
import { parseUploadRequest } from './upload-file-route-request';
import {
  broadcastUploadQueueChange,
  processBuiltInUploadedQueueJobs,
  processUploadsInTransaction,
  triggerUploadQueueProcessing,
} from './upload-file-route-processing';

export async function handleUploadFilePost(request: NextRequest) {
  const startTime = Date.now();

  try {
    const parsed = await parseUploadRequest(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    const authorization = await authorizeUploadRequest(parsed.data.source_id);
    if (!authorization.ok) {
      return authorization.response;
    }

    try {
      await ensureBucketExists();
    } catch (minioError) {
      console.error('[UPLOAD] MinIO bucket check error:', minioError);
      console.error(`MinIO bucket access failed during upload by ${authorization.actingUserName}`, {
        error: minioError instanceof Error ? minioError.message : 'Unknown error',
        stack: minioError instanceof Error ? minioError.stack : undefined,
      });
      return NextResponse.json({
        error: 'Storage service unavailable. Please try again later.',
        details: 'Failed to access file storage',
      }, { status: 503 });
    }

    const results = await processUploadsInTransaction(parsed.data, authorization.actingUserId);
    const successCount = results.filter((result) => result.status === 'success').length;
    const failureCount = results.filter((result) => result.status === 'failed').length;
    const processingTime = Date.now() - startTime;

    await broadcastUploadQueueChange();

    if (successCount > 0) {
      try {
        const handledByBuiltInProcessor = await processBuiltInUploadedQueueJobs(results);
        if (!handledByBuiltInProcessor) {
          await triggerUploadQueueProcessing(request);
        }
      } catch (autoProcessError) {
        console.error('[UPLOAD] Failed to auto-trigger upload queue processing:', autoProcessError);
      }
    }

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount,
      },
      batch_id: parsed.data.batch_id,
      processing_time_ms: processingTime,
    }, {
      status: failureCount === 0 ? 200 : 207,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const processingTime = Date.now() - startTime;

    console.error('[UPLOAD] Upload files error:', error);
    try {
      console.error('Bulk file upload failed', {
        error: errorMessage,
        processingTimeMs: processingTime,
      });
    } catch (logError) {
      console.error('[UPLOAD] Failed to log audit event:', logError);
    }

    return NextResponse.json({
      error: 'Internal server error during file upload',
      details: errorMessage,
      processing_time_ms: processingTime,
    }, { status: 500 });
  }
}
