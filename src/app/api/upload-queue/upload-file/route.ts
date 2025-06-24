import { NextRequest, NextResponse } from 'next/server';
import { minioClient, MINIO_BUCKET, ensureBucketExists } from '@/lib/minio';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * @openapi
 * /api/upload-queue/upload-file:
 *   post:
 *     summary: Upload multiple files to MinIO
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded with status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       file_name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       file_path:
 *                         type: string
 *                       error:
 *                         type: string
 *       400:
 *         description: No files uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    // Accept both 'files' (array) and fallback to 'file' (single) for backward compatibility
    let files = formData.getAll('files');
    if (!files.length) {
      // fallback to single file field
      const singleFile = formData.get('file');
      if (singleFile && typeof singleFile !== 'string') {
        files = [singleFile];
      }
    }
    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Ensure bucket exists before uploading
    try {
      await ensureBucketExists();
    } catch (minioError) {
      console.error('MinIO bucket check error:', minioError);
      return NextResponse.json({
        error: 'Failed to access storage. Please check your MinIO configuration.'
      }, { status: 500 });
    }

    const results = await Promise.all(files.map(async (file: any) => {
      if (!file || typeof file === 'string') {
        return {
          file_name: typeof file === 'string' ? file : '',
          status: 'failed',
          error: 'Invalid file object',
        };
      }
      const ext = file.name.split('.').pop();
      const objectName = `uploads/${uuidv4()}.${ext}`;
      let buffer;
      try {
        buffer = Buffer.from(await file.arrayBuffer());
      } catch (err) {
        return {
          file_name: file.name,
          status: 'failed',
          error: 'Failed to read file buffer',
        };
      }
      try {
        await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
          'Content-Type': file.type,
        });
        return {
          file_name: file.name,
          status: 'success',
          file_path: objectName,
        };
      } catch (minioError) {
        console.error('MinIO upload error:', minioError);
        return {
          file_name: file.name,
          status: 'failed',
          error: 'Failed to upload file to storage',
        };
      }
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Upload files error:', error);
    return NextResponse.json({
      error: 'Internal server error during file upload'
    }, { status: 500 });
  }
} 