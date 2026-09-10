import prisma from '@/lib/prisma';
import { buildServerFileUrl } from '@/lib/fileUrls';
import { getApplicantActivityLogs } from './applicant-logs-format-utils';

export async function fetchApplicantActivityLogs(applicantId: string) {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: {
      id: true,
      applicationDate: true,
      position: { select: { title: true } },
    },
  });
  if (!applicant) {
    return null;
  }

  const [transitions, recruitmentStages, attachments, importLogs] = await Promise.all([
    prisma.transitionRecord.findMany({
      where: { applicantId },
      orderBy: { date: 'desc' },
      include: { actingUser: true },
    }),
    prisma.recruitmentStage.findMany({
      select: { id: true, name: true },
    }),
    prisma.attachment.findMany({
      where: { applicantId },
      orderBy: { uploadedAt: 'desc' },
      include: { uploadedBy: true },
    }),
    prisma.logEntry.findMany({
      where: {
        source: 'logAuditEvent:Applicant',
        message: { contains: `(${applicantId})` },
      },
      orderBy: { timestamp: 'desc' },
      include: { actingUser: true },
    }),
  ]);

  const attachmentsWithUrls = await Promise.all(attachments.map(async (attachment) => ({
    ...attachment,
    url: await buildServerFileUrl(attachment.filePath, {
      strategy: 'preview',
      fileName: attachment.fileName,
      applicantId,
    }),
  })));

  return getApplicantActivityLogs({
    applicant,
    recruitmentStages,
    attachments: attachmentsWithUrls,
    transitions,
    importLogs,
  });
}
