import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const client = await getPool().connect();
    try {
        const dataRes = await client.query('SELECT * FROM upload_queue ORDER BY upload_date DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const countRes = await client.query('SELECT COUNT(*) FROM upload_queue');
        return NextResponse.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10) });
    }
    finally {
        client.release();
    }
}
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await request.json();
    const { file_name, file_size, status, source, upload_id, created_by, file_path } = data;
    if (!file_path) {
        return NextResponse.json({ error: 'file_path is required' }, { status: 400 });
    }
    const id = uuidv4();
    const client = await getPool().connect();
    try {
        const res = await client.query(`INSERT INTO upload_queue (id, file_name, file_size, status, source, upload_id, created_by, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`, [id, file_name, file_size, status, source, upload_id, created_by, file_path]);
        return NextResponse.json(res.rows[0], { status: 201 });
    }
    finally {
        client.release();
    }
}
