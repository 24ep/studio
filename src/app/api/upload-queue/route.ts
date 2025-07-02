import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';

/**
 * @openapi
 * /api/upload-queue:
 *   get:
 *     summary: Get paginated upload queue
 *     description: Returns a paginated list of upload queue jobs. Requires authentication.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: Paginated upload queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   data:
 *                     - id: "uuid"
 *                       file_name: "resume.pdf"
 *                       file_size: 123456
 *                       status: "queued"
 *                       source: "bulk"
 *                       upload_id: "uuid"
 *                       created_by: "user-uuid"
 *                   total: 1
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add a file to the upload queue
 *     description: Adds a new file to the upload queue. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file_name:
 *                 type: string
 *                 example: "resume.pdf"
 *               file_size:
 *                 type: integer
 *                 example: 123456
 *               status:
 *                 type: string
 *                 example: "queued"
 *               source:
 *                 type: string
 *                 example: "bulk"
 *               upload_id:
 *                 type: string
 *                 example: "uuid"
 *               created_by:
 *                 type: string
 *                 example: "user-uuid"
 *               file_path:
 *                 type: string
 *                 example: "/path/to/resume.pdf"
 *     responses:
 *       201:
 *         description: Upload queue job created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   id: "uuid"
 *                   file_name: "resume.pdf"
 *                   file_size: 123456
 *                   status: "queued"
 *                   source: "bulk"
 *                   upload_id: "uuid"
 *                   created_by: "user-uuid"
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const actingUserId = session.user.id;
  const actingUserName = session.user.name || session.user.email || 'System';
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  
  const client = await getPool().connect();
  try {
    const dataRes = await client.query('SELECT * FROM upload_queue ORDER BY upload_date DESC LIMIT $1 OFFSET $2', [limit, offset]);
    const countRes = await client.query('SELECT COUNT(*) FROM upload_queue');
    
    await logAudit('AUDIT', `Upload queue accessed by ${actingUserName}. Retrieved ${dataRes.rows.length} items.`, 'API:UploadQueue:Get', actingUserId, { 
      limit, 
      offset, 
      totalCount: parseInt(countRes.rows[0].count, 10),
      returnedCount: dataRes.rows.length 
    });
    
    return NextResponse.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10) });
  } catch (error) {
    await logAudit('ERROR', `Failed to fetch upload queue by ${actingUserName}. Error: ${(error as Error).message}`, 'API:UploadQueue:Get', actingUserId);
    throw error;
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const actingUserId = session.user.id;
  const actingUserName = session.user.name || session.user.email || 'System';
  
  const data = await request.json();
  const { file_name, file_size, status, source, upload_id, created_by, file_path } = data;
  console.log('Upload queue POST received:', data);
  console.log('Parsed values:', { file_name, file_size, status, source, upload_id, created_by, file_path });
  if (!file_path) {
    await logAudit('WARN', `Upload queue entry attempted without file_path by ${actingUserName}`, 'API:UploadQueue:Post', actingUserId, { data });
    return NextResponse.json({ error: 'file_path is required' }, { status: 400 });
  }
  
  const id = uuidv4();
  const client = await getPool().connect();
  try {
    const res = await client.query(
      `INSERT INTO upload_queue (id, file_name, file_size, status, source, upload_id, created_by, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, file_name, file_size, status, source, upload_id, created_by, file_path]
    );
    
    await logAudit('AUDIT', `File '${file_name}' added to upload queue by ${actingUserName}`, 'API:UploadQueue:Post', actingUserId, { 
      queueId: id,
      fileName: file_name,
      fileSize: file_size,
      status,
      source,
      uploadId: upload_id,
      filePath: file_path
    });
    
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    await logAudit('ERROR', `Failed to add file '${file_name}' to upload queue by ${actingUserName}. Error: ${(error as Error).message}`, 'API:UploadQueue:Post', actingUserId, { 
      fileName: file_name,
      error: (error as Error).message 
    });
    console.error('Upload queue POST error:', error);
    throw error;
  } finally {
    client.release();
  }
} 