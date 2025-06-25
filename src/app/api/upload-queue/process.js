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
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
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
export async function POST(request) {
    var _a, e_1, _b, _c;
    // API Key check
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.PROCESSOR_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const client = await getPool().connect();
    let job;
    try {
        // 1. Find the oldest queued job
        const res = await client.query(`SELECT * FROM upload_queue WHERE status = 'queued' ORDER BY upload_date ASC LIMIT 1`);
        if (res.rows.length === 0) {
            // Publish queue update event
            const redisClient = await import('@/lib/redis').then(m => m.getRedisClient());
            if (redisClient) {
                await redisClient.publish('candidate_upload_queue', JSON.stringify({ type: 'queue_updated' }));
            }
            return NextResponse.json({ message: 'No queued jobs' }, { status: 200 });
        }
        job = res.rows[0];
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
        // 3. POST to n8n webhook
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), job.file_name);
        const n8nRes = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            body: formData
        });
        let status = 'success';
        let error = null;
        let error_details = null;
        if (!n8nRes.ok) {
            status = 'error';
            error = `n8n responded with status ${n8nRes.status}`;
            error_details = await n8nRes.text();
        }
        // 4. Update job status
        await client.query(`UPDATE upload_queue SET status = $1, error = $2, error_details = $3, completed_date = now(), updated_at = now() WHERE id = $4`, [status, error, error_details, job.id]);
        // Publish queue update event
        const redisClient = await import('@/lib/redis').then(m => m.getRedisClient());
        if (redisClient) {
            await redisClient.publish('candidate_upload_queue', JSON.stringify({ type: 'queue_updated' }));
        }
        return NextResponse.json({ job: Object.assign(Object.assign({}, job), { status, error, error_details }), n8n_status: n8nRes.status });
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
