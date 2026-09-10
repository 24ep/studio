import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { MINIO_BUCKET, minioClient } from '@/lib/minio';

export async function handleUploadSystemSettingsImage(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const objectName = await uploadSettingsImage(file);
  const publicUrl = await (await import('@/lib/fileUrls')).buildServerFileUrl(objectName, { strategy: 'stream' });
  return NextResponse.json({ url: publicUrl });
}

async function uploadSettingsImage(file: File) {
  const extension = file.name.split('.').pop();
  const { generateSecureFilename } = await import('@/lib/cryptoUtils');
  const objectName = `settings/${Date.now()}-${generateSecureFilename(12)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await getPool();
  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': file.type,
  });

  return objectName;
}

