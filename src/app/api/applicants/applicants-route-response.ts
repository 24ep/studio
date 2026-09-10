import { normalizeFitScore } from '../../../lib/scoreUtils';
import type {
  ApplicantRouteListResponseMetadata,
  ApplicantRouteRow,
} from './applicants-route-query-types';

export interface ApplicantCreateInput {
  name: string;
  email: string;
  phone?: string | null;
  positionId: string | null;
  fitScore: number;
  status: string;
  parsedData: Record<string, unknown>;
  applicationDate?: string;
  sourceId?: string | null;
  subSource?: string | null;
  customAttributes: Record<string, unknown>;
  assignmentJustification?: string | null;
  avatarUrl?: string | null;
}

type JobMatchInput = Record<string, unknown> & {
  jobId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getRecord(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const nestedValue = value[key];
  return isRecord(nestedValue) ? nestedValue : undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isJobMatchInput(value: unknown): value is JobMatchInput {
  return isRecord(value) && typeof value.jobId === 'string' && value.jobId.length > 0;
}

export function buildApplicantRouteListHeaders({
  filters,
  page,
  limit,
  total,
  responseTime,
}: ApplicantRouteListResponseMetadata) {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': `"${Buffer.from(JSON.stringify({ filters, page, limit, total, responseTime })).toString('base64').slice(0, 8)}"`,
    'X-Response-Time': `${responseTime}ms`,
    'X-Total-Count': total.toString(),
    'X-Page-Size': limit.toString(),
  };
}

export function buildApplicantRoutePagination({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function normalizeApplicantRouteRows(rows: ApplicantRouteRow[]) {
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    fitScore: normalizeFitScore(row.fitScore),
    expectedSalary: row.expectedSalary,
    status: row.status,
    statusId: row.statusId,
    applicationDate: row.applicationDate,
    updatedAt: row.updatedAt,
    positionId: row.positionId,
    recruiterId: row.recruiterId,
    sourceId: row.sourceId,
    parsedData: row.parsedData,
    avatarUrl: row.avatarUrl,
    isPinned: row.isPinned,
    pinnedAt: row.pinnedAt,
    position: row.positionTitle ? { title: row.positionTitle } : null,
    recruiter: row.recruiterName ? { name: row.recruiterName } : null,
    source: row.sourceName ? { name: row.sourceName } : null,
    isBlacklisted: row.isBlacklisted,
    isRead: row.isRead ?? null,
  }));
}

export function buildApplicantCreateInput(validatedData: unknown, rawBody: unknown = {}): ApplicantCreateInput | null {
  const applicantInfo = getRecord(validatedData, 'applicant_info');
  const personalInfo = getRecord(applicantInfo, 'personal_info');
  const contactInfo = getRecord(applicantInfo, 'contact_info');
  const jobMatches = isRecord(validatedData) ? validatedData.job_matches : undefined;
  const jobApplied = getRecord(validatedData, 'job_applied');
  const rawBodyRecord = isRecord(rawBody) ? rawBody : {};

  const firstName = getString(personalInfo?.firstname);
  const lastName = getString(personalInfo?.lastname);
  const name = firstName && lastName
    ? `${firstName} ${lastName}`
    : undefined;
  const email = getString(contactInfo?.email);

  if (!name || !email) {
    return null;
  }

  const safeJobMatches = Array.isArray(jobMatches)
    ? jobMatches.filter(isJobMatchInput)
    : [];
  const positionId = getString(jobApplied?.jobId) || safeJobMatches[0]?.jobId || null;
  const parsedData: Record<string, unknown> = {};

  if (applicantInfo) parsedData.applicant_info = applicantInfo;
  if (safeJobMatches.length > 0) parsedData.job_matches = safeJobMatches;
  if (jobApplied) parsedData.job_applied = jobApplied;

  return {
    name,
    email,
    phone: getString(contactInfo?.phone),
    positionId,
    fitScore: typeof jobApplied?.fitScore === 'number' ? jobApplied.fitScore : 0,
    status: getString(applicantInfo?.status) || 'new',
    parsedData,
    applicationDate: isRecord(validatedData) ? getString(validatedData.applicationDate) : undefined,
    sourceId: getString(rawBodyRecord.sourceId) || null,
    subSource: getString(rawBodyRecord.subSource) || null,
    customAttributes: isRecord(rawBodyRecord.customAttributes) ? rawBodyRecord.customAttributes : {},
    assignmentJustification: getString(rawBodyRecord.assignmentJustification) || null,
    avatarUrl: getString(personalInfo?.avatar_url) || null,
  };
}
