import { type NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getPool, type DbClient } from '@/lib/db';
import { dispatchWebhooks, type WebhookData } from '@/lib/webhookDispatcher';
import { isJsonObject } from '@/lib/json-types';
import { readRequestJsonResult } from '@/lib/request-json';
import { processSingleUploadQueueJob } from '@/lib/uploadQueueProcessor';
import { getResumeProcessingWebhookSettings } from '@/lib/upload-queue/resume-processing-webhook-settings';
import { broadcastUploadQueueUpdate } from './sse/broadcastUploadQueueUpdate';
import { requireUploadQueueManageSession } from './upload-queue-route-auth';

interface UploadQueuePostBody {
  file_name?: string;
  file_size?: number | string;
  status?: string;
  source?: string;
  upload_id?: string;
  file_path?: string;
  position_id?: string;
  applied_position_id?: string;
  webhook_payload?: unknown;
  source_id?: string;
  sub_source?: string;
}

type UploadQueuePostJob = Record<string, unknown> & {
  id: string;
  status?: string | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getRecordValue(value: unknown, key: string) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
}

function getStringRecordValue(value: unknown, key: string) {
  const recordValue = getRecordValue(value, key);
  return typeof recordValue === 'string' ? recordValue : undefined;
}

async function getReprocessFileSize(filePath: string, currentFileSize: number): Promise<number> {
  if (currentFileSize) {
    return currentFileSize;
  }

  try {
    const { minioClient } = await import('@/lib/minio');
    const { MINIO_BUCKET } = await import('@/lib/minio-constants');
    const fileStats = await minioClient.statObject(MINIO_BUCKET, filePath);
    return fileStats.size;
  } catch (error) {
    console.warn(`[UPLOAD_QUEUE] Could not get file size from MinIO for ${filePath}:`, error);
    return currentFileSize;
  }
}

function normalizeUploadQueuePostBody(data: UploadQueuePostBody) {
  const isReprocessJob = data.source === 'reprocess' || getStringRecordValue(data.webhook_payload, 'source') === 'reprocess';
  const parsedFileSize = typeof data.file_size === 'string'
    ? parseInt(data.file_size, 10) || 0
    : data.file_size ?? 0;

  let finalPositionId = data.position_id || data.applied_position_id || null;
  const payloadTargetPositionId = getStringRecordValue(data.webhook_payload, 'targetPositionId');
  if (!finalPositionId && payloadTargetPositionId) {
    finalPositionId = payloadTargetPositionId;
  }

  return {
    ...data,
    file_size: parsedFileSize,
    finalPositionId,
    isReprocessJob,
  };
}

async function insertUploadQueueJob(client: DbClient, data: ReturnType<typeof normalizeUploadQueuePostBody>, actingUserId: string) {
  return client.query(
    `INSERT INTO upload_queue (id, file_name, file_size, status, source, upload_id, created_by, file_path, webhook_payload, position_id, source_id, sub_source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      uuidv4(),
      data.file_name,
      data.file_size,
      data.status,
      data.source,
      data.upload_id,
      actingUserId,
      data.file_path,
      data.webhook_payload ? JSON.stringify(data.webhook_payload) : null,
      data.finalPositionId,
      data.source_id,
      data.sub_source,
    ]
  );
}

async function upsertReprocessUploadQueueJob(client: DbClient, data: ReturnType<typeof normalizeUploadQueuePostBody>, actingUserId: string) {
  try {
    return await insertUploadQueueJob(client, data, actingUserId);
  } catch (insertError) {
    if (
      getStringRecordValue(insertError, 'code') !== '23505'
      || getStringRecordValue(insertError, 'constraint') !== 'upload_queue_file_path_status_key'
    ) {
      throw insertError;
    }

    const result = await client.query(
      `UPDATE upload_queue
       SET source = $1, webhook_payload = $2, updated_at = now()
       WHERE file_path = $3 AND status = $4
       RETURNING *`,
      [
        data.source,
        data.webhook_payload ? JSON.stringify(data.webhook_payload) : null,
        data.file_path,
        data.status,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update existing job for reprocess');
    }

    return result;
  }
}

async function notifyUploadQueueCreated(job: unknown): Promise<void> {
  const webhookJob: WebhookData = job && typeof job === 'object' ? job as WebhookData : {};

  try {
    await dispatchWebhooks.uploadQueueCreated(webhookJob);
  } catch {
    // Preserve fire-and-forget webhook behavior.
  }

  try {
    await broadcastUploadQueueUpdate();
  } catch {
    // Preserve fire-and-forget SSE behavior.
  }
}

function isUploadQueuePostJob(job: unknown): job is UploadQueuePostJob {
  return Boolean(job && typeof job === 'object' && typeof (job as { id?: unknown }).id === 'string');
}

async function processBuiltInUploadQueueJobIfNeeded(client: DbClient, job: UploadQueuePostJob) {
  const settings = await getResumeProcessingWebhookSettings();
  const status = typeof job.status === 'string' ? job.status : null;

  if (settings.mode !== 'built-in' || status !== 'queued') {
    return null;
  }

  await client.query(
    `UPDATE upload_queue SET status = 'inprocess', process_date = now(), updated_at = now() WHERE id = $1`,
    [job.id]
  );

  return processSingleUploadQueueJob({
    ...job,
    status: 'inprocess',
  }, client);
}

export async function handleUploadQueuePost(request: NextRequest) {
  const authorization = await requireUploadQueueManageSession();
  if (!authorization.ok) {
    return authorization.response;
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const normalizedBody = normalizeUploadQueuePostBody(isJsonObject(bodyResult.value) ? bodyResult.value : {});

  if (!normalizedBody.file_path) {
    return NextResponse.json({ error: 'file_path is required' }, { status: 400 });
  }

  if (normalizedBody.isReprocessJob) {
    normalizedBody.file_size = await getReprocessFileSize(normalizedBody.file_path, normalizedBody.file_size);
  }

  let client: DbClient | null = null;
  try {
    client = await getPool().connect();
  } catch (connectionError) {
    console.error('[Upload Queue API] Failed to connect to database:', connectionError);
    return NextResponse.json({
      error: 'Database connection error',
      details: getErrorMessage(connectionError),
    }, { status: 500 });
  }

  try {
    const result = normalizedBody.isReprocessJob
      ? await upsertReprocessUploadQueueJob(client, normalizedBody, authorization.actingUserId)
      : await insertUploadQueueJob(client, normalizedBody, authorization.actingUserId);
    const job = result.rows[0];
    if (!isUploadQueuePostJob(job)) {
      throw new Error('Created upload queue job is missing id');
    }

    await notifyUploadQueueCreated(job);
    const processingResult = await processBuiltInUploadQueueJobIfNeeded(client, job);

    return NextResponse.json({
      ...job,
      ...(processingResult ? { processingResult } : {}),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: getErrorMessage(error) || 'Internal server error',
      details: 'Failed to add file to upload queue',
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
