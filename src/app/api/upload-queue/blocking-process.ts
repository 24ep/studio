import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions, validateUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';
import { processSingleUploadQueueJob } from './process/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const validation = await validateUserSession(session);
  if (!validation.isValid) {
    await logAudit('ERROR', `Blocking upload queue entry attempted with invalid session by ${validation.userName || 'Unknown'}`, 'API:UploadQueue:BlockingPost', null, {
      invalidUserId: validation.userId,
      sessionUser: validation.userName,
      error: validation.error
    });
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  const actingUserId = validation.userId!;
  const actingUserName = validation.userName!;
  const data = await request.json();
  const { file_name, file_size, status, source, upload_id, file_path, webhook_payload } = data;
  if (!file_path) {
    await logAudit('WARN', `Blocking upload queue entry attempted without file_path by ${actingUserName}`, 'API:UploadQueue:BlockingPost', actingUserId, { data });
    return NextResponse.json({ error: 'file_path is required' }, { status: 400 });
  }
  const id = uuidv4();
  const client = await getPool().connect();
  try {
    // Insert job into upload_queue
    const res = await client.query(
      `INSERT INTO upload_queue (id, file_name, file_size, status, source, upload_id, created_by, file_path, webhook_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, file_name, file_size, status, source, upload_id, actingUserId, file_path, webhook_payload ? JSON.stringify(webhook_payload) : null]
    );
    const job = res.rows[0];
    await logAudit('AUDIT', `File '${file_name}' added to upload queue (blocking) by ${actingUserName}`, 'API:UploadQueue:BlockingPost', actingUserId, {
      queueId: id,
      fileName: file_name,
      fileSize: file_size,
      status,
      source,
      uploadId: upload_id,
      filePath: file_path
    });
    // Immediately process the job and wait for webhook
    const result = await processSingleUploadQueueJob(job, client);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    await logAudit('ERROR', `Failed to add/process file '${file_name}' to upload queue (blocking) by ${actingUserName}. Error: ${(error as Error).message}`, 'API:UploadQueue:BlockingPost', actingUserId, {
      fileName: file_name,
      error: (error as Error).message
    });
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    client.release();
  }
} 