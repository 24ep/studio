import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { minioClient, MINIO_BUCKET } from '@/lib/minio';
import { buildServerFileUrl } from '@/lib/fileUrls';

export async function getApplicantCommentAttachmentsByIds(ids: string[], applicantId?: string) {
  if (!ids || ids.length === 0) return [];

  const attachments = await prisma.attachment.findMany({
    where: { id: { in: ids } },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  });

  return Promise.all(attachments.map(async (attachment) => ({
    ...attachment,
    url: await buildServerFileUrl(attachment.filePath, {
      strategy: 'preview',
      applicantId: applicantId || attachment.applicantId || undefined,
    }),
  })));
}

export async function getApplicantCommentAttachmentsMap(ids: string[], applicantId?: string) {
  const attachmentMap = new Map();
  if (!ids || ids.length === 0) return attachmentMap;

  const attachments = await getApplicantCommentAttachmentsByIds(ids, applicantId);
  attachments.forEach((attachment) => {
    attachmentMap.set(attachment.id, attachment);
  });

  return attachmentMap;
}

export async function uploadApplicantCommentAttachments({
  applicantId,
  userId,
  files,
  labels,
}: {
  applicantId: string;
  userId: string;
  files: File[];
  labels: string[];
}) {
  const { ensureBucketExists } = await import('@/lib/minio');
  await ensureBucketExists();

  const attachmentIds: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const label = labels[index] || 'other';
    const ext = (file.name || 'bin').split('.').pop();
    const objectName = `attachments/${applicantId}/${uuidv4()}.${ext}`;

    try {
      const arrayBuffer = await file.arrayBuffer();
      await minioClient.putObject(
        MINIO_BUCKET,
        objectName,
        Buffer.from(arrayBuffer),
        undefined,
        { 'Content-Type': file.type || 'application/octet-stream' }
      );

      const newAttachment = await prisma.attachment.create({
        data: {
          applicantId,
          uploadedById: userId,
          filePath: objectName,
          fileName: file.name,
          label,
          isPrimary: false,
        },
      });
      attachmentIds.push(newAttachment.id);
    } catch (uploadError) {
      console.error(`Failed to upload file ${file.name}:`, uploadError);
    }
  }

  return attachmentIds;
}
