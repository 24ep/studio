import type { Prisma } from '@prisma/client';

export type EvaluationLinkItem = Prisma.ApplicantEvaluationLinkGetPayload<{
  include: ReturnType<typeof getEvaluationLinksInclude>;
}>;

export interface EvaluationLinksQueryParams {
  applicantId?: string;
  limit: number;
  offset: number;
  q: string;
  status?: string;
}

export function parseEvaluationLinksQueryParams(searchParams: URLSearchParams): EvaluationLinksQueryParams {
  return {
    applicantId: searchParams.get('applicantId') || undefined,
    limit: Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100),
    offset: parseInt(searchParams.get('offset') || '0', 10) || 0,
    q: (searchParams.get('q') || '').trim(),
    status: searchParams.get('status') || undefined,
  };
}

export function buildEvaluationLinksWhereInput(
  query: EvaluationLinksQueryParams,
  now = new Date()
): Prisma.ApplicantEvaluationLinkWhereInput {
  return {
    ...getEvaluationLinksApplicantFilter(query.applicantId),
    ...getEvaluationLinksStatusFilter(query.status, now),
    ...getEvaluationLinksSearchFilter(query.q),
  };
}

export function getEvaluationLinksInclude() {
  return {
    applicant: {
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        customAttributes: true,
        position: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
    },
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  } satisfies Prisma.ApplicantEvaluationLinkInclude;
}

export function serializeEvaluationLinkItem(it: EvaluationLinkItem) {
  const customAttrs = isRecord(it.applicant?.customAttributes)
    ? it.applicant.customAttributes
    : {};
  const interviewDate = customAttrs.interviewDateTime || customAttrs.interviewDate || null;

  return {
    id: it.id,
    applicant: {
      ...it.applicant,
      position: it.applicant?.position || null,
    },
    createdBy: it.createdBy,
    token: it.token,
    url: buildEvaluationLinkUrl(it.applicantId, it.token),
    expiresAt: it.expiresAt,
    revokedAt: it.revokedAt,
    requireLogin: it.requireLogin,
    createdAt: it.createdAt,
    interviewDateTime: interviewDate,
    interviewLocation: customAttrs.interviewLocation || null,
    interviewers: customAttrs.interviewers || [],
  };
}

export function getEvaluationLinksErrorPayload(error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal Server Error';
  const hint = message.toLowerCase().includes('relation')
    ? 'Database table missing. Run migrations.'
    : undefined;

  return { error: 'Internal Server Error', message, hint };
}

function getEvaluationLinksApplicantFilter(applicantId?: string) {
  return applicantId ? { applicantId } : {};
}

function getEvaluationLinksStatusFilter(status: string | undefined, now: Date) {
  if (!status || status === 'all') {
    return {};
  }

  const statusFilters: Record<string, Prisma.ApplicantEvaluationLinkWhereInput> = {
    active: { revokedAt: null, expiresAt: { gt: now } },
    expired: { revokedAt: null, expiresAt: { lte: now } },
    revoked: { revokedAt: { not: null } },
  };

  return statusFilters[status] || {};
}

function getEvaluationLinksSearchFilter(q: string) {
  if (!q) {
    return {};
  }

  return {
    OR: [
      { token: { contains: q, mode: 'insensitive' } },
      { applicant: { name: { contains: q, mode: 'insensitive' } } },
      { applicant: { email: { contains: q, mode: 'insensitive' } } },
    ],
  } satisfies Prisma.ApplicantEvaluationLinkWhereInput;
}

function buildEvaluationLinkUrl(applicantId: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:8021';
  return `${baseUrl}/applicants/${encodeURIComponent(applicantId)}/evaluate?token=${encodeURIComponent(token)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
