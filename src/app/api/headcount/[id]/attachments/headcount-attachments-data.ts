import prisma from '@/lib/prisma';

const ATTACHMENT_UPLOADED_BY_INCLUDE = {
  uploadedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

export function fetchHeadcountAttachments(headcountId: string) {
  return prisma.attachment.findMany({
    where: { headcountId },
    include: ATTACHMENT_UPLOADED_BY_INCLUDE,
    orderBy: { uploadedAt: 'desc' },
  });
}

export function fetchHeadcount(headcountId: string) {
  return prisma.headcount.findUnique({
    where: { id: headcountId },
  });
}

export function createHeadcountAttachmentRecord({
  headcountId,
  uploadedById,
  objectName,
  fileName,
  label,
}: {
  headcountId: string;
  uploadedById: string;
  objectName: string;
  fileName: string;
  label: string;
}) {
  return prisma.attachment.create({
    data: {
      headcountId,
      uploadedById,
      filePath: objectName,
      fileName,
      label,
      isPrimary: false,
    },
    include: ATTACHMENT_UPLOADED_BY_INCLUDE,
  });
}

export function fetchHeadcountAttachment(headcountId: string, attachmentId: string) {
  return prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      headcountId,
    },
  });
}

export function deleteHeadcountAttachmentRecord(attachmentId: string) {
  return prisma.attachment.delete({
    where: { id: attachmentId },
  });
}
