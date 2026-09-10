import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { sanitizeFilename } from '@/lib/fileUtils';
import {
  ensureBucketExists,
  MINIO_BUCKET,
  minioClient,
} from '@/lib/minio';
import { hasPermission } from '@/lib/permissions';
import { securityConfig } from '@/lib/securityConfig';

export const dynamic = 'force-dynamic';

const PORTAL_IMAGE_TYPES = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type PortalObject = { name?: string; size?: number; lastModified?: Date };

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'COMPANY_PORTAL_MANAGE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureBucketExists();
    const stream = minioClient.listObjectsV2(MINIO_BUCKET, 'company-portal/', true);
    const assets = await new Promise<PortalObject[]>((resolve, reject) => {
      const rows: PortalObject[] = [];
      stream.on('data', object => rows.push(object));
      stream.on('error', reject);
      stream.on('end', () => resolve(rows));
    });
    return NextResponse.json({
      assets: assets
        .filter(asset => asset.name)
        .sort((left, right) => (right.lastModified?.getTime() || 0) - (left.lastModified?.getTime() || 0))
        .map(asset => ({
          name: asset.name!.split('/').pop() || asset.name,
          size: asset.size || 0,
          updatedAt: asset.lastModified?.toISOString() || null,
          url: `/api/public/company-portal/assets?filePath=${encodeURIComponent(asset.name!)}`,
        })),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[COMPANY-PORTAL-ASSET] Listing failed:', error);
    return NextResponse.json({ error: 'Failed to list portal assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'COMPANY_PORTAL_MANAGE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No image was selected' }, { status: 400 });
    }

    const extension = PORTAL_IMAGE_TYPES[file.type as keyof typeof PORTAL_IMAGE_TYPES];
    if (!extension) {
      return NextResponse.json(
        { error: 'Use a PNG, JPG, WebP, or GIF image' },
        { status: 400 },
      );
    }

    if (file.size > securityConfig.fileUpload.maxImageSize) {
      const maxSizeMb = securityConfig.fileUpload.maxImageSize / (1024 * 1024);
      return NextResponse.json(
        { error: `Image size must be less than ${maxSizeMb}MB` },
        { status: 400 },
      );
    }

    await ensureBucketExists();

    const objectName = `company-portal/${Date.now()}-${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': file.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-amz-meta-originalname': sanitizeFilename(file.name),
      'x-amz-meta-uploaded-by': session.user.id,
      'x-amz-meta-upload-date': new Date().toISOString(),
    });

    const url = `/api/public/company-portal/assets?filePath=${encodeURIComponent(objectName)}`;
    return NextResponse.json(
      { success: true, url },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('[COMPANY-PORTAL-ASSET] Upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload portal image' },
      { status: 500 },
    );
  }
}
