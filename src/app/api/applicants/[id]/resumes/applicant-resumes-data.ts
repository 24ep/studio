import prisma from '@/lib/prisma';
import { buildServerFileUrl } from '@/lib/fileUrls';
import { ensureArray } from '@/lib/utils/safe-array';
import type { ResumePagination } from './applicant-resumes-types';

export async function fetchApplicantResumes(applicantId: string, pagination: ResumePagination) {
  return Promise.all([
    prisma.applicant.findUnique({ where: { id: applicantId }, select: { id: true } }),
    prisma.attachment.findMany({
      where: { applicantId },
      orderBy: { uploadedAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    }),
  ]);
}

export async function addResumeUrls<T extends { filePath: string }>(attachments: T[]) {
  return Promise.all(
    attachments.map(async attachment => ({
      ...attachment,
      url: await buildServerFileUrl(attachment.filePath, { strategy: 'stream' }),
    }))
  );
}

export function countApplicantAttachments(applicantId: string) {
  return prisma.attachment.count({ where: { applicantId } });
}

export async function createApplicantResumeAttachment({
  applicantId,
  uploadedById,
  filePath,
  fileName,
  label,
  isPrimary,
}: {
  applicantId: string;
  uploadedById: string;
  filePath: string;
  fileName: string;
  label: string;
  isPrimary: boolean;
}) {
  return prisma.attachment.create({
    data: {
      applicantId,
      uploadedById,
      filePath,
      fileName,
      isPrimary,
      label,
    },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  });
}

export async function addResumeUrl<T extends { filePath: string }>(attachment: T) {
  return {
    ...attachment,
    url: await buildServerFileUrl(attachment.filePath, { strategy: 'stream' }),
  };
}

export async function setApplicantPrimaryResume(applicantId: string, attachmentId: string) {
  await prisma.attachment.updateMany({ where: { applicantId }, data: { isPrimary: false } });
  return prisma.attachment.update({ where: { id: attachmentId, applicantId }, data: { isPrimary: true } });
}

export function fetchApplicantForAttachmentDelete(applicantId: string) {
  return prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { id: true, recruiterId: true },
  });
}

export function fetchApplicantAttachment(applicantId: string, attachmentId: string) {
  return prisma.attachment.findUnique({ where: { id: attachmentId, applicantId } });
}

export function deleteApplicantAttachmentRecord(applicantId: string, attachmentId: string) {
  return prisma.attachment.delete({ where: { id: attachmentId, applicantId } });
}

export async function promoteNewestApplicantAttachment(applicantId: string) {
  const remaining = await prisma.attachment.findMany({
    where: { applicantId },
    orderBy: { uploadedAt: 'desc' },
  });
  const [newPrimary] = ensureArray<typeof remaining[number]>(remaining);

  if (newPrimary) {
    await prisma.attachment.update({ where: { id: newPrimary.id }, data: { isPrimary: true } });
  }
}
