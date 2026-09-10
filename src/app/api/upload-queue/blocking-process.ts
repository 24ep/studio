import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { validateUserSession } from '@/lib/auth';
import { auth } from '@/auth';
// import { logAudit } from '@/lib/auditLog'; // Removed to avoid database logging
import { processSingleUploadQueueJob } from '@/lib/uploadQueueProcessor';
import { getJsonNumber, getJsonObject, getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const validation = await validateUserSession(session);
  if (!validation.isValid) {
    console.error(`Blocking upload queue entry attempted with invalid session by ${validation.userName || 'Unknown'}`, {
      invalidUserId: validation.userId,
      sessionUser: validation.userName,
      error: validation.error
    });
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  const actingUserId = validation.userId!;
  const actingUserName = validation.userName!;
  const data = await readRequestJsonObject(request);
  const file_name = getJsonString(data, 'file_name');
  const file_size = getJsonNumber(data, 'file_size') ?? getJsonString(data, 'file_size') ?? 0;
  const status = getJsonString(data, 'status');
  const source = getJsonString(data, 'source');
  const upload_id = getJsonString(data, 'upload_id');
  const file_path = getJsonString(data, 'file_path');
  const webhook_payload = getJsonObject(data, 'webhook_payload');
  const position_id = getJsonString(data, 'position_id');
  const applied_position_id = getJsonString(data, 'applied_position_id');
  const finalPositionId = position_id || applied_position_id || null;
  if (!file_path) {
    console.warn(`Blocking upload queue entry attempted without file_path by ${actingUserName}`, { data });
    return NextResponse.json({ error: 'file_path is required' }, { status: 400 });
  }
  const id = uuidv4();
  const client = await getPool().connect();
  try {
    // Insert job into upload_queue
    const res = await client.query(
      `INSERT INTO upload_queue (id, file_name, file_size, status, source, upload_id, created_by, file_path, webhook_payload, position_id, source_id, sub_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [id, file_name, file_size, status, source, upload_id, actingUserId, file_path, webhook_payload ? JSON.stringify(webhook_payload) : null, finalPositionId, null, null]
    );
    const job = res.rows[0];
  
    // Immediately process the job and wait for webhook
    const result = await processSingleUploadQueueJob(job, client);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(`Failed to add/process file '${file_name}' to upload queue (blocking) by ${actingUserName}. Error: ${(error as Error).message}`, {
      fileName: file_name,
      error: (error as Error).message
    });
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    client.release();
  }
} 
