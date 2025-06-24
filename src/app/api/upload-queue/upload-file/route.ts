import { NextRequest, NextResponse } from 'next/server';
import { minioClient, MINIO_BUCKET, ensureBucketExists } from '@/lib/minio';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * @openapi
 * /api/upload-queue/upload-file:
 *   post:
 *     summary: Upload a file to MinIO
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
 *       400:
 *         description: No file uploaded
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
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const ext = (file as File).name.split('.').pop();
    const objectName = `uploads/${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    
    try {
      // Ensure bucket exists before uploading
      await ensureBucketExists();
      
      await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
        'Content-Type': (file as File).type,
      });
    } catch (minioError) {
      console.error('MinIO upload error:', minioError);
      return NextResponse.json({ 
        error: 'Failed to upload file to storage. Please check your MinIO configuration.' 
      }, { status: 500 });
    }

    return NextResponse.json({ file_path: objectName });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during file upload' 
    }, { status: 500 });
  }
} 