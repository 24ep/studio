import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { minioClient } from '@/lib/minio';
import { MINIO_BUCKET, MINIO_PUBLIC_BASE_URL } from '@/lib/minio-constants';
import { v4 as uuidv4 } from 'uuid';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
// GET: List attachments for a Applicant
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const attachments = await prisma.attachment.findMany({
      where: { applicantId: id },
      orderBy: { uploadedAt: 'desc' },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });
    // Add public URL
    const { buildServerFileUrl } = await import('@/lib/fileUrls');
    const attachmentsWithUrl = await Promise.all(
      attachments.map(async (a: typeof attachments[0]) => ({
        ...a,
        url: await buildServerFileUrl(a.filePath, { strategy: 'stream' })
      }))
    );
    return NextResponse.json({ data: attachmentsWithUrl });
  } catch (err) {
    return NextResponse.json({ message: 'Error fetching attachments', error: String(err) }, { status: 500 });
  }
}

// POST: Upload an attachment (multipart/form-data)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // Parse multipart form
  const formData = await req.formData();
  const file = formData.get('attachment');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
  }
  const ext = (file.name || 'pdf').split('.').pop();
  const objectName = `attachments/${id}/${uuidv4()}.${ext}`;
  try {
    // Upload to MinIO
    const arrayBuffer = await file.arrayBuffer();
    await minioClient.putObject(
      MINIO_BUCKET,
      objectName,
      Buffer.from(arrayBuffer),
      undefined,
      { 'Content-Type': file.type || 'application/pdf' }
    );
    // Set isPrimary true if this is the first attachment
    const count = await prisma.attachment.count({ where: { applicantId: id } });
    const isPrimary = count === 0;
    // Store in DB
    const newAttachment = await prisma.attachment.create({
      data: {
        applicantId: id,
        uploadedById: session.user.id,
        filePath: objectName,
        fileName: file.name,
        isPrimary,
        label: 'resume', // Added label field as required
      },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ data: { ...newAttachment, url: await (await import('@/lib/fileUrls')).buildServerFileUrl(objectName, { strategy: 'stream' }) } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: 'Error uploading attachment', error: String(err) }, { status: 500 });
  }
}

// PUT: Set an attachment as primary
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await readRequestJsonObject(req);
  const attachmentId = getJsonString(body, 'attachmentId');
  if (!attachmentId) {
    return NextResponse.json({ message: 'Attachment ID is required' }, { status: 400 });
  }
  try {
    // Unset all
    await prisma.attachment.updateMany({ where: { applicantId: id }, data: { isPrimary: false } });
    // Set one
    const updated = await prisma.attachment.update({ where: { id: attachmentId, applicantId: id }, data: { isPrimary: true } });
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ message: 'Error setting primary attachment', error: String(err) }, { status: 500 });
  }
}

// DELETE: Remove an attachment
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await readRequestJsonObject(req);
  const attachmentId = getJsonString(body, 'attachmentId');
  if (!attachmentId) {
    return NextResponse.json({ message: 'Attachment ID is required' }, { status: 400 });
  }
  try {
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId, applicantId: id } });
    if (!attachment) return NextResponse.json({ message: 'Attachment not found' }, { status: 404 });
    // Delete from MinIO
    await minioClient.removeObject(MINIO_BUCKET, attachment.filePath);
    // Delete from DB
    await prisma.attachment.delete({ where: { id: attachmentId, applicantId: id } });
    // If primary was deleted, set first as primary
    const remaining = await prisma.attachment.findMany({ where: { applicantId: id }, orderBy: { uploadedAt: 'desc' } });
    if (attachment.isPrimary && remaining.length > 0) {
      await prisma.attachment.update({ where: { id: remaining[0].id }, data: { isPrimary: true } });
    }
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ message: 'Error deleting attachment', error: String(err) }, { status: 500 });
  }
} 
