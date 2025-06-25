import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
/**
 * @openapi
 * /api/upload-queue/{id}:
 *   patch:
 *     summary: Update an upload queue job by ID
 *     description: Updates fields of an upload queue job by its ID. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the upload queue job
 *         example: "uuid"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *           examples:
 *             example:
 *               summary: Example request
 *               value:
 *                 status: "processing"
 *     responses:
 *       200:
 *         description: Upload queue job updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   id: "uuid"
 *                   status: "processing"
 *       400:
 *         description: No fields to update
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
export async function PATCH(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const id = params.id;
    const data = await request.json();
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of Object.keys(data)) {
        fields.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
    }
    if (fields.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    values.push(id);
    const client = await getPool().connect();
    try {
        const res = await client.query(`UPDATE upload_queue SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`, values);
        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        // Publish queue update event
        const redisClient = await import('@/lib/redis').then(m => m.getRedisClient());
        if (redisClient) {
            await redisClient.publish('candidate_upload_queue', JSON.stringify({ type: 'queue_updated' }));
        }
        return NextResponse.json(res.rows[0]);
    }
    finally {
        client.release();
    }
}
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const id = params.id;
    const client = await getPool().connect();
    try {
        const res = await client.query(`DELETE FROM upload_queue WHERE id = $1 RETURNING *`, [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        // Publish queue update event
        const redisClient = await import('@/lib/redis').then(m => m.getRedisClient());
        if (redisClient) {
            await redisClient.publish('candidate_upload_queue', JSON.stringify({ type: 'queue_updated' }));
        }
        return NextResponse.json({ success: true });
    }
    finally {
        client.release();
    }
}
