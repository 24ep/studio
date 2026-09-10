import prisma from '@/lib/prisma';
import { minioClient } from '@/lib/minio';
import { MINIO_BUCKET } from '@/lib/minio-constants';
import { v4 as uuidv4 } from 'uuid';
import { buildServerFileUrl } from '@/lib/fileUrls';
import type { AttachmentRouteUser } from './attachments-route-auth';

export async function listApplicantAttachments(applicantId: string) {
  const attachments = await prisma.attachment.findMany({
    where: { applicantId },
    orderBy: { uploadedAt: 'desc' },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  });

  return await Promise.all(
    attachments.map(async (attachment) => ({
      ...attachment,
      url: await buildServerFileUrl(attachment.filePath, { strategy: 'stream' }),
    }))
  );
}

export async function createApplicantAttachmentFromFile({
  applicantId,
  user,
  file,
  label,
}: {
  applicantId: string;
  user: AttachmentRouteUser;
  file: File;
  label: string;
}) {
  const ext = (file.name || 'pdf').split('.').pop();
  const objectName = `attachments/${applicantId}/${uuidv4()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  await minioClient.putObject(
    MINIO_BUCKET,
    objectName,
    Buffer.from(arrayBuffer),
    undefined,
    { 'Content-Type': file.type || 'application/pdf' }
  );

  return await createApplicantAttachmentRecord({
    applicantId,
    uploadedById: user.id,
    objectName,
    fileName: file.name,
    label,
  });
}

export async function createApplicantAttachmentFromBuffer({
  applicantId,
  user,
  buffer,
  fileName,
  contentType,
  label,
}: {
  applicantId: string;
  user: AttachmentRouteUser;
  buffer: Buffer;
  fileName: string;
  contentType: string;
  label: string;
}) {
  const ext = fileName.split('.').pop() || 'bin';
  const objectName = `attachments/${applicantId}/${uuidv4()}.${ext}`;

  await minioClient.putObject(
    MINIO_BUCKET,
    objectName,
    buffer,
    undefined,
    { 'Content-Type': contentType }
  );

  return await createApplicantAttachmentRecord({
    applicantId,
    uploadedById: user.id,
    objectName,
    fileName,
    label,
  });
}

async function createApplicantAttachmentRecord({
  applicantId,
  uploadedById,
  objectName,
  fileName,
  label,
}: {
  applicantId: string;
  uploadedById: string;
  objectName: string;
  fileName: string;
  label: string;
}) {
  const count = await prisma.attachment.count({ where: { applicantId } });
  const newAttachment = await prisma.attachment.create({
    data: {
      applicantId,
      uploadedById,
      filePath: objectName,
      fileName,
      isPrimary: count === 0,
      label,
    },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  });

  return {
    ...newAttachment,
    url: await buildServerFileUrl(objectName, { strategy: 'stream' }),
  };
}

export async function setApplicantPrimaryAttachment(applicantId: string, attachmentId: string) {
  await prisma.attachment.updateMany({ where: { applicantId }, data: { isPrimary: false } });
  return await prisma.attachment.update({
    where: { id: attachmentId, applicantId },
    data: { isPrimary: true },
  });
}

export async function deleteApplicantAttachment(applicantId: string, attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId, applicantId } });
  if (!attachment) {
    return { status: 'not-found' as const };
  }

  await minioClient.removeObject(MINIO_BUCKET, attachment.filePath);
  await prisma.attachment.delete({ where: { id: attachmentId, applicantId } });

  const remaining = await prisma.attachment.findMany({
    where: { applicantId },
    orderBy: { uploadedAt: 'desc' },
  });

  if (attachment.isPrimary && remaining.length > 0) {
    await prisma.attachment.update({ where: { id: remaining[0].id }, data: { isPrimary: true } });
  }

  return { status: 'deleted' as const };
}
