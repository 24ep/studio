import { Buffer } from 'buffer';
import type { DbClient } from '@/lib/db';
import { minioClient } from '@/lib/minio';
import { MINIO_BUCKET } from '@/lib/minio-constants';
import { failUploadQueueJob } from './upload-queue-job-status';

const MAX_UPLOAD_QUEUE_FILE_SIZE = 500 * 1024 * 1024;

type UploadQueueFileJob = {
  id: string;
  file_path?: string | null;
  file_name?: string | null;
};

type UploadQueueFileJobWithPath = UploadQueueFileJob & {
  file_path: string;
};

function hasFilePath(job: UploadQueueFileJob): job is UploadQueueFileJobWithPath {
  return typeof job.file_path === 'string' && job.file_path.length > 0;
}

export async function validateUploadQueueFile(job: UploadQueueFileJob, client: DbClient) {
  if (!hasFilePath(job)) {
    console.error(`Job ${job.id} has invalid file_path:`, job.file_path);
    await failUploadQueueJob(
      client,
      job.id,
      'Invalid file_path (null or empty) in job',
      `file_path: ${String(job.file_path)}`
    );
    console.error(`Upload queue job failed - invalid file_path for job ${job.id}`, {
      jobId: job.id,
      fileName: job.file_name,
      error: 'Invalid file_path',
    });
    return { ok: false, result: { error: 'Invalid file_path for job', job } };
  }

  try {
    await downloadUploadQueueFile(job);
    return { ok: true };
  } catch (minioError) {
    console.error('[Webhook] Failed to download file from MinIO:', minioError);

    const errorInfo = getMinioErrorInfo(minioError);
    await failUploadQueueJob(client, job.id, errorInfo.message, errorInfo.details);
    return { ok: false, result: { error: errorInfo.message, job } };
  }
}

async function downloadUploadQueueFile(job: UploadQueueFileJobWithPath) {
  const fileStats = await minioClient.statObject(MINIO_BUCKET, job.file_path);

  if (fileStats.size > MAX_UPLOAD_QUEUE_FILE_SIZE) {
    console.warn(`File too large (${fileStats.size} bytes), skipping processing for job ${job.id}`);
    throw new Error(`File size: ${fileStats.size} bytes, max allowed: ${MAX_UPLOAD_QUEUE_FILE_SIZE} bytes`);
  }

  const fileStream = await minioClient.getObject(MINIO_BUCKET, job.file_path);
  const chunks: Buffer[] = [];
  let totalSize = 0;

  await new Promise<void>((resolve, reject) => {
    fileStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      totalSize += chunk.length;

      if (totalSize > MAX_UPLOAD_QUEUE_FILE_SIZE) {
        console.error(`File download exceeded size limit during streaming for job ${job.id}`);
        fileStream.destroy();
        reject(new Error(`File download exceeded size limit: ${totalSize} bytes`));
      }
    });

    fileStream.on('end', resolve);
    fileStream.on('error', reject);
  });

  Buffer.concat(chunks);
  chunks.length = 0;
}

function getMinioErrorInfo(minioError: unknown) {
  const details = minioError instanceof Error ? minioError.message : String(minioError);

  if (details.includes('File download exceeded size limit')) {
    return {
      message: 'File download exceeded size limit',
      details,
    };
  }

  if (details.startsWith('File size:')) {
    return {
      message: 'File too large for processing',
      details,
    };
  }

  return {
    message: 'Failed to download file from MinIO',
    details,
  };
}
