var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
import { getSystemSetting } from '@/lib/settings';
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
    var _a, e_1, _b, _c;
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
            return NextResponse.json({ message: 'No queued jobs' }, { status: 200 });
        }
        job = res.rows[0];
        // Validate file_path before proceeding
        if (!job.file_path) {
            console.error(`Job ${job.id} has invalid file_path:`, job.file_path);
            await client.query(`UPDATE upload_queue SET status = 'error', error = $1, error_details = $2, completed_date = now(), updated_at = now() WHERE id = $3`, ['Invalid file_path (null or empty) in job', `file_path: ${job.file_path}`, job.id]);
            return NextResponse.json({ error: 'Invalid file_path for job', job }, { status: 500 });
        }
        // 2. Download file from MinIO
        const fileStream = await minioClient.getObject(MINIO_BUCKET, job.file_path);
        const chunks = [];
        try {
            for (var _d = true, fileStream_1 = __asyncValues(fileStream), fileStream_1_1; fileStream_1_1 = await fileStream_1.next(), _a = fileStream_1_1.done, !_a; _d = true) {
                _c = fileStream_1_1.value;
                _d = false;
                const chunk = _c;
                chunks.push(chunk);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = fileStream_1.return)) await _b.call(fileStream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const fileBuffer = Buffer.concat(chunks);
        // 3. POST to the configured webhook endpoint (any compatible service)
        let resumeWebhookUrl = await getSystemSetting('resumeProcessingWebhookUrl');
        if (!resumeWebhookUrl) {
            resumeWebhookUrl = process.env.RESUME_PROCESSING_WEBHOOK_URL || 'http://localhost:5678/webhook';
        }
        console.log('Posting to webhook URL:', resumeWebhookUrl);
        const form = new FormData();
        form.append('file', new Blob([fileBuffer]), job.file_name);
        let webhookRes;
        try {
            webhookRes = await fetch(resumeWebhookUrl, {
                method: 'POST',
                body: form
            });
        }
        catch (fetchErr) {
            console.error('Fetch to webhook URL failed:', fetchErr);
            throw fetchErr;
        }
        if (!webhookRes.ok) {
            const errorText = await webhookRes.text();
            console.error('Webhook POST failed:', webhookRes.status, errorText);
        }
        let status = 'success';
        let error = null;
        let error_details = null;
        if (!webhookRes.ok) {
            status = 'error';
            error = `Webhook responded with status ${webhookRes.status}`;
            error_details = await webhookRes.text();
        }
        // 4. Update job status
        await client.query(`UPDATE upload_queue SET status = $1, error = $2, error_details = $3, completed_date = now(), updated_at = now() WHERE id = $4`, [status, error, error_details, job.id]);
        // Publish queue update event
        const redisClient = await import('@/lib/redis').then(m => m.getRedisClient());
        if (redisClient) {
            await redisClient.publish('candidate_upload_queue', JSON.stringify({ type: 'queue_updated' }));
        }
        return NextResponse.json({ job: Object.assign(Object.assign({}, job), { status, error, error_details }), automation_status: webhookRes.status });
    }
    catch (err) {
        if (job) {
            await client.query(`UPDATE upload_queue SET status = 'error', error = $1, error_details = $2, completed_date = now(), updated_at = now() WHERE id = $3`, [err.message, err.stack, job.id]);
        }
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
    finally {
        client.release();
    }
}
