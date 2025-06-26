import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSystemSetting } from '@/lib/settings';

/**
 * @openapi
 * /api/upload-queue/process:
 *   post:
 *     summary: Process the next queued upload job
 *     description: Processes the next file in the upload queue by sending it to n8n. Requires authentication. Not for public use.
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
 *                   n8n_status: 200
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
  // DEBUG: Log the API key from env and the received header
  console.log('API handler env PROCESSOR_API_KEY:', process.env.PROCESSOR_API_KEY);
  const apiKey = request.headers.get('x-api-key');
  console.log('API handler received x-api-key:', apiKey);
  if (apiKey !== process.env.PROCESSOR_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await getPool().connect();
  let job;
  try {
    // 1. Atomically pick and mark the oldest queued job as 'processing'
    const res = await client.query(
      `UPDATE upload_queue
       SET status = 'processing', updated_at = now()
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
      return NextResponse.json({ message: 'No queued jobs' }, { status: 200 });
    }
    job = res.rows[0];
    // Validate file_path before proceeding
    if (!job.file_path) {
      console.error(`Job ${job.id} has invalid file_path:`, job.file_path);
      await client.query(
        `UPDATE upload_queue SET status = 'error', error = $1, error_details = $2, completed_date = now(), updated_at = now() WHERE id = $3`,
        ['Invalid file_path (null or empty) in job', `file_path: ${job.file_path}`, job.id]
      );
      return NextResponse.json({ error: 'Invalid file_path for job', job }, { status: 500 });
    }
    // 2. Download file from MinIO
    const fileStream = await minioClient.getObject(MINIO_BUCKET, job.file_path);
    const chunks = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    // 3. POST to the configured webhook endpoint (any compatible service)
    let resumeWebhookUrl = await getSystemSetting('resumeProcessingWebhookUrl');
    if (!resumeWebhookUrl) {
      // fallback to old key for backward compatibility
      resumeWebhookUrl = await getSystemSetting('n8nResumeWebhookUrl');
    }
    if (!resumeWebhookUrl) {
      resumeWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
    }
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), job.file_name);
    const webhookRes = await fetch(resumeWebhookUrl, {
      method: 'POST',
      body: formData
    });
    let status = 'success';
    let error = null;
    let error_details = null;
    if (!webhookRes.ok) {
      status = 'error';
      error = `Webhook responded with status ${webhookRes.status}`;
      error_details = await webhookRes.text();
    }
    // 4. Update job status
    await client.query(
      `UPDATE upload_queue SET status = $1, error = $2, error_details = $3, completed_date = now(), updated_at = now() WHERE id = $4`,
      [status, error, error_details, job.id]
    );
    // Publish queue update event
    const redisClient = await import('@/lib/redis').then(m => m.getRedisClient());
    if (redisClient) {
      await redisClient.publish('candidate_upload_queue', JSON.stringify({ type: 'queue_updated' }));
    }
    return NextResponse.json({ job: { ...job, status, error, error_details }, webhook_status: webhookRes.status });
  } catch (err) {
    if (job) {
      await client.query(
        `UPDATE upload_queue SET status = 'error', error = $1, error_details = $2, completed_date = now(), updated_at = now() WHERE id = $3`,
        [(err as Error).message, (err as Error).stack, job.id]
      );
    }
    return NextResponse.json({ error: (err as Error).message, stack: (err as Error).stack }, { status: 500 });
  } finally {
    client.release();
  }
} 