import prisma from '@/lib/prisma';
import { getApplicantCommentAttachmentsByIds, getApplicantCommentAttachmentsMap, uploadApplicantCommentAttachments } from './applicant-comments-attachments';
import type { Prisma } from '@prisma/client';

type ApplicantCommentWithAuthor = Prisma.ApplicantCommentGetPayload<{
  include: { author: { select: { id: true; name: true; email: true } } };
}>;

function getCommentAttachmentIds(comment: Pick<ApplicantCommentWithAuthor, 'attachmentIds'>) {
  return comment.attachmentIds ?? [];
}

export async function fetchApplicantCommentsPage({
  applicantId,
  limit,
  offset,
  canViewAll,
  canViewRemarks,
}: {
  applicantId: string;
  limit: number;
  offset: number;
  canViewAll: boolean;
  canViewRemarks: boolean;
}) {
  const whereClause: Prisma.ApplicantCommentWhereInput = { applicantId };
  if (!canViewAll && canViewRemarks) {
    whereClause.type = 'remark';
  }

  const [applicant, comments, counts] = await Promise.all([
    prisma.applicant.findUnique({ where: { id: applicantId }, select: { id: true } }),
    prisma.applicantComment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { author: { select: { id: true, name: true, email: true } } },
    }),
    Promise.all([
      prisma.applicantComment.count({ where: { applicantId } }),
      prisma.applicantComment.count({ where: { applicantId, type: 'comment' } }),
      prisma.applicantComment.count({ where: { applicantId, type: 'remark' } }),
    ]),
  ]);

  if (!applicant) {
    return null;
  }

  const allAttachmentIds = comments.flatMap(getCommentAttachmentIds);
  const attachmentMap = await getApplicantCommentAttachmentsMap(allAttachmentIds, applicantId);
  const commentsWithAttachments = comments.map((comment) => ({
    ...comment,
    attachments: getCommentAttachmentIds(comment).map((id) => attachmentMap.get(id)).filter(Boolean),
  }));

  const [total, totalComments, totalRemarks] = counts;

  return {
    data: commentsWithAttachments,
    pagination: {
      limit,
      offset,
      total,
      totalComments,
      totalRemarks,
      hasMore: offset + comments.length < total,
    },
  };
}

export async function createApplicantComment({
  applicantId,
  userId,
  content,
  type,
  files,
  labels,
}: {
  applicantId: string;
  userId: string;
  content: string;
  type: string;
  files: File[];
  labels: string[];
}) {
  const attachmentIds = await uploadApplicantCommentAttachments({ applicantId, userId, files, labels });

  const newComment = await prisma.applicantComment.create({
    data: {
      applicantId,
      authorId: userId,
      content,
      type,
      attachmentIds,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return {
    raw: newComment,
    response: {
      ...newComment,
      attachments: await getApplicantCommentAttachmentsByIds(attachmentIds, applicantId),
    },
  };
}

export async function updateApplicantComment({
  applicantId,
  userId,
  commentId,
  content,
  files,
  labels,
}: {
  applicantId: string;
  userId: string;
  commentId: string;
  content: string;
  files: File[];
  labels: string[];
}) {
  const newAttachmentIds = await uploadApplicantCommentAttachments({ applicantId, userId, files, labels });
  const existing = await prisma.applicantComment.findUnique({ where: { id: commentId, applicantId } });

  if (!existing) {
    return { status: 'not_found' as const };
  }

  if (existing.authorId !== userId) {
    return { status: 'forbidden' as const };
  }

  const updatedComment = await prisma.applicantComment.update({
    where: { id: commentId, applicantId },
    data: {
      content,
      attachmentIds: [...(existing.attachmentIds || []), ...newAttachmentIds],
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return {
    status: 'ok' as const,
    raw: updatedComment,
    response: {
      ...updatedComment,
      attachments: await getApplicantCommentAttachmentsByIds(updatedComment.attachmentIds, applicantId),
    },
  };
}

export async function deleteApplicantComment({
  applicantId,
  userId,
  commentId,
}: {
  applicantId: string;
  userId: string;
  commentId: string;
}) {
  const comment = await prisma.applicantComment.findUnique({ where: { id: commentId, applicantId } });

  if (!comment) {
    return { status: 'not_found' as const };
  }

  if (comment.authorId !== userId) {
    return { status: 'forbidden' as const };
  }

  await prisma.applicantComment.delete({ where: { id: commentId, applicantId } });

  return {
    status: 'ok' as const,
    comment,
  };
}
