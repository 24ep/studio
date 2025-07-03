import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSystemSetting } from '@/lib/settings';
import { Buffer } from 'buffer';
import { logAudit } from '@/lib/auditLog';

/**
 * @openapi
 * /api/upload-queue/process:
 *   post:
 *     summary: Process the next queued upload job
 *     description: Processes the next file in the upload queue by sending it to an automation webhook. Requires authentication. Not for public use.
 *     responses:
 *       200:
 *         description: Job processed (or no jobs)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Job processed
 *                 value:
 *                   job:
 *                     id: "uuid"
 *                     file_name: "resume.pdf"
 *                     status: "success"
 *                   automation_status: 200
 *               no_jobs:
 *                 summary: No queued jobs
 *                 value:
 *                   message: "No queued jobs"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error processing job
 */
export async function POST(request: NextRequest) {
  
  const apiKey = request.headers.get('x-api-key');

  if (apiKey !== process.env.PROCESSOR_API_KEY) {
    await logAudit('WARN', 'Unauthorized attempt to process upload queue with invalid API key', 'API:UploadQueue:Process', null, { 
      providedKey: apiKey ? 'present' : 'missing' 
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await logAudit('INFO', 'Upload queue processing started', 'API:UploadQueue:Process', null);
  
  const client = await getPool().connect();
  let job;
  let payload = null;
  try {
    // 1. Atomically pick and mark the oldest queued job as 'inprogress'
    const res = await client.query(
      `UPDATE upload_queue
       SET status = 'inprogress', updated_at = now()
       WHERE id = (
         SELECT id FROM upload_queue WHERE status = 'queued' ORDER BY upload_date ASC LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`
    );
    if (res.rows.length === 0) {
      // Publish queue update event
      const redisClient = await import('@/lib/redis').then(m => m.getRedisClient());
      if (redisClient) {
        await redisClient.publish('candidate_upload_queue', JSON.stringify({ type: 'queue_updated' }));
      }
      await logAudit('INFO', 'Upload queue processing completed - no queued jobs', 'API:UploadQueue:Process', null);
      return NextResponse.json({ message: 'No queued jobs' }, { status: 200 });
    }
    job = res.rows[0];
    
    await logAudit('INFO', `Processing upload queue job '${job.file_name}' (ID: ${job.id})`, 'API:UploadQueue:Process', null, { 
      jobId: job.id,
      fileName: job.file_name,
      fileSize: job.file_size,
      source: job.source 
    });
    
    // Validate file_path before proceeding
    if (!job.file_path) {
      console.error(`Job ${job.id} has invalid file_path:`, job.file_path);
      await client.query(
        `UPDATE upload_queue SET status = 'error', error = $1, error_details = $2, completed_date = now(), updated_at = now() WHERE id = $3`,
        ['Invalid file_path (null or empty) in job', `file_path: ${job.file_path}`, job.id]
      );
      await logAudit('ERROR', `Upload queue job failed - invalid file_path for job ${job.id}`, 'API:UploadQueue:Process', null, { 
        jobId: job.id,
        fileName: job.file_name,
        error: 'Invalid file_path' 
      });
      return NextResponse.json({ error: 'Invalid file_path for job', job }, { status: 500 });
    }
    // 2. Download file from MinIO
    const fileStream = await minioClient.getObject(MINIO_BUCKET, job.file_path);
    const chunks = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    let fileBuffer: Buffer | null = Buffer.concat(chunks);
    // 3. POST to the configured webhook endpoint (any compatible service)
    let resumeWebhookUrl = await getSystemSetting('resumeProcessingWebhookUrl');
    if (!resumeWebhookUrl) {
      resumeWebhookUrl = process.env.RESUME_PROCESSING_WEBHOOK_URL || '';
    }
    let webhookRes = null;
    let webhookError = null;
    let status = 'success';
    let error = null;
    let error_details = null;
    let appliedJob = undefined;
    if (resumeWebhookUrl && resumeWebhookUrl.startsWith('http')) {
      // Build JSON payload as required
      const publicUrl = `${process.env.MINIO_PUBLIC_BASE_URL || ''}/${MINIO_BUCKET}/${job.file_path}`;
      const inputs = {
        cv_url: publicUrl,
        applied_job_id: job.position_id,
        applied_job_level: job.position_level,
        applied_job_title: job.position_title,
        applied_job_description: job.position_description,
        candidate_id: job.candidate_id,
        job_id: job.id,
        meta: job.meta,
        filename: job.filename,
        mimetype: job.mimetype,
      };
      const jsonPayload = {
        inputs,
        response_mode: 'blocking',
        user: 'abc-123',
      };
      let webhookResStatus = null;
      try {
        webhookRes = await fetch(resumeWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonPayload),
        });
        webhookResStatus = webhookRes.status;
        if (!webhookRes.ok) {
          webhookError = `Webhook responded with status ${webhookRes.status}`;
        }
      } catch (err) {
        if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
          webhookError = (err as any).message;
        } else {
          webhookError = 'Unknown error calling webhook';
        }
      }
      if (webhookRes && !webhookRes.ok) {
        status = 'error';
        error = `Webhook responded with status ${webhookRes.status}`;
        error_details = webhookError;
      }
      // For logging/debugging, store a summary of the payload
      payload = jsonPayload;
    } else {
      // Webhook not set, skip file processing for webhook
      webhookError = 'Webhook URL not set or invalid, skipping webhook file send.';
      console.warn('[Webhook Skipped]', webhookError);
      // Optionally, set status to 'skipped' if you want to track this
      // status = 'skipped';
    }
    // 4. Update job status
    await client.query(
      `UPDATE upload_queue SET status = $1, error = $2, error_details = $3, completed_date = now(), updated_at = now(), webhook_payload = $4, webhook_response = $5 WHERE id = $6`,
      [status, error, error_details, payload, { status: webhookRes && 'status' in webhookRes ? webhookRes.status : null, response: webhookError || 'Success' }, job.id]
    );
    // Publish queue update event
    const redisClient = await import('@/lib/redis').then(m => m.getRedisClient());
    if (redisClient) {
      await redisClient.publish('candidate_upload_queue', JSON.stringify({ type: 'queue_updated' }));
    }

    // Explicitly nullify large objects to help GC
    fileBuffer = null;
    // If chunks is still in scope, nullify it too
    // chunks = null;
    // Optionally force GC if available (for debugging only)
    if (typeof global !== 'undefined' && typeof global.gc === 'function') {
      global.gc();
    }
    
    if (status === 'success') {
      await logAudit('AUDIT', `Upload queue job '${job.file_name}' processed successfully`, 'API:UploadQueue:Process', null, { 
        jobId: job.id,
        fileName: job.file_name,
        webhookStatus: webhookRes && 'status' in webhookRes ? webhookRes.status : null,
        hasAppliedJob: !!appliedJob 
      });
    } else {
      await logAudit('ERROR', `Upload queue job '${job.file_name}' failed with webhook error`, 'API:UploadQueue:Process', null, { 
        jobId: job.id,
        fileName: job.file_name,
        webhookStatus: webhookRes && 'status' in webhookRes ? webhookRes.status : null,
        error,
        errorDetails: error_details 
      });
    }
    
    return NextResponse.json({ job: { ...job, status, error, error_details }, automation_status: webhookRes && 'status' in webhookRes ? webhookRes.status : null });
  } catch (err) {
    if (job) {
      await client.query(
        `UPDATE upload_queue SET status = 'error', error = $1, error_details = $2, completed_date = now(), updated_at = now(), webhook_payload = $3, webhook_response = $4 WHERE id = $5`,
        [(err as Error).message, (err as Error).stack, payload, { error: (err as Error).message, stack: (err as Error).stack }, job.id]
      );
      await logAudit('ERROR', `Upload queue job '${job.file_name}' failed with exception`, 'API:UploadQueue:Process', null, { 
        jobId: job.id,
        fileName: job.file_name,
        error: (err as Error).message,
        stack: (err as Error).stack 
      });
    }
    return NextResponse.json({ error: (err as Error).message, stack: (err as Error).stack }, { status: 500 });
  } finally {
    client.release();
  }
} 