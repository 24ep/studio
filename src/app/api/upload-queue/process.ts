import { NextRequest, NextResponse } from 'next/server';
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
export async function POST(request: NextRequest) {
  // API Key check
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.PROCESSOR_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await getPool().connect();
  let job;
  try {
    // 1. Find the oldest queued job
    const res = await client.query(
      `SELECT * FROM upload_queue WHERE status = 'queued' ORDER BY upload_date ASC LIMIT 1`
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ message: 'No queued jobs' }, { status: 200 });
    }
    job = res.rows[0];
    // 2. Download file from MinIO
    const fileStream = await minioClient.getObject(MINIO_BUCKET, job.file_path);
    const chunks = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
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
    await client.query(
      `UPDATE upload_queue SET status = $1, error = $2, error_details = $3, completed_date = now(), updated_at = now() WHERE id = $4`,
      [status, error, error_details, job.id]
    );
    return NextResponse.json({ job: { ...job, status, error, error_details }, n8n_status: n8nRes.status });
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

// Background processor for the upload queue
if (require.main === module) {
  // Only run if this file is executed directly
  const INTERVAL_MS = 5000; // 5 seconds
  async function runProcessorLoop() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await POST(new NextRequest({ headers: {} }));
        if (res && res.status === 200) {
          const data = await res.json();
          if (data && data.message === 'No queued jobs') {
            // No jobs, can log or just wait
          } else {
            console.log('Processed job:', data);
          }
        } else if (res) {
          const data = await res.json();
          console.error('Error processing job:', data);
        }
      } catch (err) {
        console.error('Background processor error:', err);
      }
      await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
    }
  }
  runProcessorLoop();
} 