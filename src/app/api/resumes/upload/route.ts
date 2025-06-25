import { NextResponse, type NextRequest } from 'next/server';
import { minioClient, MINIO_BUCKET, MINIO_PUBLIC_BASE_URL } from '@/lib/minio';
import { getPool } from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = "force-dynamic";

/**
 * @openapi
 * /api/resumes/upload:
 *   post:
 *     summary: Upload a resume
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const candidateId = url.searchParams.get('candidateId');
    if (!candidateId) {
      return NextResponse.json({ message: 'Missing candidateId' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('resume');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const ext = originalName.split('.').pop();
    const objectName = `resumes/${candidateId}/${randomUUID()}.${ext}`;

    // Upload to MinIO
    await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': file.type,
      'x-amz-meta-originalname': originalName,
    });

    // Update candidate in DB
    const pool = getPool();
    const updateQuery = `UPDATE "Candidate" SET "resumePath" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *;`;
    const result = await pool.query(updateQuery, [objectName, candidateId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
    }
    const candidate = result.rows[0];

    return NextResponse.json({ message: 'Resume uploaded', candidate, file_path: objectName, url: `${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${objectName}` });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ message: (error as Error).message || 'Internal server error' }, { status: 500 });
  }
}
