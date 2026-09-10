import { normalizeFitScore } from '@/lib/scoreUtils';

type PositionApplicantJobMatch = {
  jobId?: string | null;
  [key: string]: unknown;
};

type PositionApplicantParsedData = Record<string, unknown> & {
  job_applied?: {
    fitScore?: number | string | null;
  } | null;
};

export type PositionApplicantRow = {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  dataAiHint?: string | null;
  resumePath?: string | null;
  parsedData?: PositionApplicantParsedData | null;
  customAttributes?: unknown;
  positionId?: string | null;
  positionTitle?: string | null;
  positionDepartment?: string | null;
  positionLevel?: string | null;
  fitScore?: number | string | null;
  statusId?: string | null;
  status?: string | null;
  applicationDate?: Date | string | null;
  recruiterId?: string | null;
  recruiterName?: string | null;
  recruiterAvatarUrl?: string | null;
  expectedSalary?: unknown;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  transitionHistory?: unknown[];
  jobMatches?: PositionApplicantJobMatch[];
  association_type?: string | null;
  isPinned?: boolean | null;
  pinnedAt?: Date | string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function serializeDate(value: Date | string | null | undefined, fallback = new Date().toISOString()) {
  if (!value) {
    return fallback;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function parseCustomAttributes(customAttributes: unknown): unknown {
  if (!customAttributes) {
    return {};
  }

  if (typeof customAttributes !== 'string') {
    return customAttributes;
  }

  try {
    return JSON.parse(customAttributes);
  } catch {
    return {};
  }
}

function resolveFitScore(row: PositionApplicantRow) {
  let fitScore = row.fitScore || 0;

  if (isRecord(row.parsedData) && 'job_applied' in row.parsedData) {
    const jobApplied = row.parsedData.job_applied;
    if (isRecord(jobApplied) && 'fitScore' in jobApplied) {
      fitScore = jobApplied.fitScore || fitScore;
    }
  }

  return normalizeFitScore(Number(fitScore));
}

function resolveAssociationType(row: PositionApplicantRow, positionId: string) {
  if (row.association_type === 'applied') {
    const hasJobMatch = row.jobMatches?.some((match) => match.jobId === positionId);
    return hasJobMatch ? 'applied_and_matched' : row.association_type;
  }

  if (row.association_type === 'matched' && row.positionId === positionId) {
    return 'applied_and_matched';
  }

  return row.association_type;
}

export function mapPositionApplicantRow(row: PositionApplicantRow, positionId: string) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || null,
    avatarUrl: row.avatarUrl || null,
    dataAiHint: row.dataAiHint || null,
    resumePath: row.resumePath || null,
    parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
    customAttributes: parseCustomAttributes(row.customAttributes),
    position: row.positionId ? {
      id: row.positionId,
      title: row.positionTitle,
      department: row.positionDepartment,
      positionLevel: row.positionLevel,
    } : null,
    fitScore: resolveFitScore(row),
    statusId: row.statusId,
    status: row.status,
    applicationDate: serializeDate(row.applicationDate),
    recruiter: row.recruiterId ? {
      id: row.recruiterId,
      name: row.recruiterName,
      avatarUrl: row.recruiterAvatarUrl || null,
      email: null,
    } : null,
    expectedSalary: row.expectedSalary,
    createdAt: serializeDate(row.createdAt),
    updatedAt: serializeDate(row.updatedAt),
    transitionHistory: row.transitionHistory || [],
    jobMatches: row.jobMatches || [],
    associationType: resolveAssociationType(row, positionId),
    isPinned: row.isPinned || false,
    pinnedAt: row.pinnedAt ? serializeDate(row.pinnedAt) : null,
  };
}
