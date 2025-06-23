import { NextRequest, NextResponse } from 'next/server';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * @openapi
 * /api/upload-queue/upload-file:
 *   post:
 *     summary: Upload a file to MinIO
 *     description: Uploads a file to MinIO and returns the file path. Requires authentication.
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
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 file_path:
 *                   type: string
 *                   example: uploads/uuid.pdf
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  const ext = (file as File).name.split('.').pop();
  const objectName = `uploads/${uuidv4()}.${ext}`;
  const buffer = Buffer.from(await (file as File).arrayBuffer());
  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': (file as File).type,
  });
  return NextResponse.json({ file_path: objectName });
} 