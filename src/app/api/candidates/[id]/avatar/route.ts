// src/app/api/candidates/[id]/avatar/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { minioClient, MINIO_BUCKET, MINIO_PUBLIC_BASE_URL } from '@/lib/minio';
import { getPool } from '@/lib/db';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.url.match(/\/candidates\/([^/]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const candidateId = extractIdFromUrl(request);
  if (!candidateId) {
    return NextResponse.json({ message: 'Missing candidateId' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('avatar');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ message: 'Invalid file type' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop();
  const objectName = `avatars/${candidateId}/${randomUUID()}.${ext}`;

  // Upload to MinIO
  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': file.type,
    'x-amz-meta-originalname': file.name,
  });

  const avatarUrl = `${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${objectName}`;

  // Update candidate in DB
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateQuery = `UPDATE "Candidate" SET "avatar_url" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *;`;
    const result = await client.query(updateQuery, [avatarUrl, candidateId]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
    }
    await client.query('COMMIT');
    return NextResponse.json({ message: 'Avatar uploaded', avatar_url: avatarUrl });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ message: 'Database error', error: String(error) }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  const id = extractIdFromUrl(request);
  // You can use 'id' as needed
  return NextResponse.json({ message: "Avatar retrieval is not implemented yet.", id }, { status: 501 });
}
