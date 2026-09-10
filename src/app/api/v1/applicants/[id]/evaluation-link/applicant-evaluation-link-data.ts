import crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

const CREATED_BY_INCLUDE = {
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

type ActiveEvaluationLink = Prisma.ApplicantEvaluationLinkGetPayload<{
  include: typeof CREATED_BY_INCLUDE;
}>;

function getEvaluationLinkModel(errorMessage = 'ApplicantEvaluationLink model not available. Run prisma generate and database migrations.') {
  const model = prisma.applicantEvaluationLink;
  if (!model) {
    throw new Error(errorMessage);
  }

  return model;
}

export function fetchEvaluationLinkApplicant(applicantId: string) {
  return prisma.applicant.findUnique({ where: { id: applicantId } });
}

export function fetchActiveEvaluationLink(applicantId: string) {
  const now = new Date();
  return getEvaluationLinkModel().findFirst({
    where: {
      applicantId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
    include: CREATED_BY_INCLUDE,
  });
}

export function fetchActiveEvaluationLinkByToken(applicantId: string, token: string) {
  const now = new Date();
  return getEvaluationLinkModel().findFirst({
    where: {
      applicantId,
      token,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function saveEvaluationLinkInterviewDetails(
  applicantId: string,
  applicant: { customAttributes?: unknown },
  details: { interviewDateTime?: string; interviewLocation?: string }
) {
  if (!details.interviewDateTime && !details.interviewLocation) {
    return;
  }

  const currentAttrs = (applicant.customAttributes as Record<string, unknown>) || {};
  await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      customAttributes: {
        ...currentAttrs,
        ...(details.interviewDateTime ? { interviewDateTime: details.interviewDateTime } : {}),
        ...(details.interviewLocation ? { interviewLocation: details.interviewLocation } : {}),
      },
    },
  });
}

export function revokeEvaluationLink(linkId: string) {
  return getEvaluationLinkModel().update({
    where: { id: linkId },
    data: { revokedAt: new Date() },
  });
}

export function createEvaluationLink(applicantId: string, createdById: string, days: number, requireLogin: boolean) {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return getEvaluationLinkModel().create({
    data: {
      applicantId,
      token,
      expiresAt,
      createdById,
      requireLogin,
    },
    include: CREATED_BY_INCLUDE,
  });
}

export function updateEvaluationLink(link: ActiveEvaluationLink, input: { days?: number; requireLogin?: boolean }) {
  let newExpiresAt = link.expiresAt;
  if (input.days) {
    const base = new Date(Math.max(Date.now(), new Date(link.expiresAt).getTime()));
    newExpiresAt = new Date(base.getTime() + input.days * 24 * 60 * 60 * 1000);
  }

  return getEvaluationLinkModel('applicantEvaluationLink model not available. Run prisma generate and database migrations.').update({
    where: { id: link.id },
    data: {
      expiresAt: newExpiresAt,
      requireLogin: typeof input.requireLogin === 'boolean' ? input.requireLogin : link.requireLogin,
    },
    include: CREATED_BY_INCLUDE,
  });
}
