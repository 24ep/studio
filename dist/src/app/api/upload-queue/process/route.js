import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
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
export async function POST(request) {
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
    try {
        // 1. Atomically pick and mark the oldest queued job as 'processing'
        const res = await client.query(`UPDATE upload_queue
       SET status = 'processing', updated_at = now()
       WHERE id = (
         SELECT id FROM upload_queue WHERE status = 'queued' ORDER BY upload_date ASC LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`);
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
            await client.query(`UPDATE upload_queue SET status = 'error', error = $1, error_details = $2, completed_date = now(), updated_at = now() WHERE id = $3`, ['Invalid file_path (null or empty) in job', `file_path: ${job.file_path}`, job.id]);
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
        const fileBuffer = Buffer.concat(chunks);
        // 3. POST to the configured webhook endpoint (any compatible service)
        let resumeWebhookUrl = await getSystemSetting('resumeProcessingWebhookUrl');
        if (!resumeWebhookUrl) {
            resumeWebhookUrl = process.env.RESUME_PROCESSING_WEBHOOK_URL || 'http://localhost:5678/webhook';
        }
        // Convert fileBuffer to base64
        const fileBase64 = fileBuffer.toString('base64');
        // Optionally include applied_job if job has position info
        let appliedJob = undefined;
        if (job.position_id || job.position_title || job.position_description || job.position_level) {
            appliedJob = {
                id: job.position_id,
                title: job.position_title,
                description: job.position_description,
                level: job.position_level
            };
        }
        const payload = {
            inputs: {
                file: fileBase64,
                fileName: job.file_name,
                mimeType: job.file_name.split('.').pop() === 'pdf' ? 'application/pdf' : undefined,
                jobId: job.id,
                filePath: job.file_path,
                applied_job: appliedJob
                // Add any other job fields you want to forward
            },
            response_mode: 'streaming',
            user: 'cv_screening'
        };
        let webhookRes;
        try {
            webhookRes = await fetch(resumeWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        catch (fetchErr) {
            console.error('Fetch to webhook URL failed:', fetchErr);
            await logAudit('ERROR', `Upload queue job failed - webhook fetch error for job ${job.id}`, 'API:UploadQueue:Process', null, {
                jobId: job.id,
                fileName: job.file_name,
                webhookUrl: resumeWebhookUrl,
                error: fetchErr.message
            });
            throw fetchErr;
        }
        let errorText = null;
        if (!webhookRes.ok) {
            errorText = await webhookRes.text();
            console.error('Webhook POST failed:', webhookRes.status, errorText);
        }
        let status = 'success';
        let error = null;
        let error_details = null;
        if (!webhookRes.ok) {
            status = 'error';
            error = `Webhook responded with status ${webhookRes.status}`;
            error_details = errorText;
        }
        // 4. Update job status
        await client.query(`UPDATE upload_queue SET status = $1, error = $2, error_details = $3, completed_date = now(), updated_at = now() WHERE id = $4`, [status, error, error_details, job.id]);
        // Publish queue update event
        const redisClient = await import('@/lib/redis').then(m => m.getRedisClient());
        if (redisClient) {
            await redisClient.publish('candidate_upload_queue', JSON.stringify({ type: 'queue_updated' }));
        }
        if (status === 'success') {
            await logAudit('AUDIT', `Upload queue job '${job.file_name}' processed successfully`, 'API:UploadQueue:Process', null, {
                jobId: job.id,
                fileName: job.file_name,
                webhookStatus: webhookRes.status,
                hasAppliedJob: !!appliedJob
            });
        }
        else {
            await logAudit('ERROR', `Upload queue job '${job.file_name}' failed with webhook error`, 'API:UploadQueue:Process', null, {
                jobId: job.id,
                fileName: job.file_name,
                webhookStatus: webhookRes.status,
                error,
                errorDetails: error_details
            });
        }
        return NextResponse.json({ job: { ...job, status, error, error_details }, automation_status: webhookRes.status });
    }
    catch (err) {
        if (job) {
            await client.query(`UPDATE upload_queue SET status = 'error', error = $1, error_details = $2, completed_date = now(), updated_at = now() WHERE id = $3`, [err.message, err.stack, job.id]);
            await logAudit('ERROR', `Upload queue job '${job.file_name}' failed with exception`, 'API:UploadQueue:Process', null, {
                jobId: job.id,
                fileName: job.file_name,
                error: err.message,
                stack: err.stack
            });
        }
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
    finally {
        client.release();
    }
}
