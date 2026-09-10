import type { JsonObject } from '../../../../lib/json-types';
import type { CompanyReference } from '../../../../lib/types';
import { normalizeFitScore } from '../../../../lib/scoreUtils';
import { promoteBuiltInApplicantDetails } from '../../../../lib/upload-queue/built-in-resume-processor-utils';

type ApplicantDetailRecord = {
  [key: string]: unknown;
};

type ParsedRecord = Record<string, unknown>;

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is ParsedRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function asStringOrNull(value: unknown): string | null {
  const result = asString(value);
  return result ? result : null;
}

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asUuid(value: unknown): string | null {
  const result = asString(value);
  return result && UUID_V4_RE.test(result) ? result : null;
}

function normalizeCompanyReferenceRecord(value: unknown): CompanyReference | null {
  if (!isRecord(value)) return null;
  const id = asStringOrNull(value.id);
  const name = asStringOrNull(value.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    legalName: asStringOrNull(value.legalName),
    logo: asStringOrNull(value.logo),
    website: asStringOrNull(value.website),
    domain: asStringOrNull(value.domain),
    industry: asStringOrNull(value.industry),
    description: asStringOrNull(value.description),
    email: asStringOrNull(value.email),
    phone: asStringOrNull(value.phone),
    address: asStringOrNull(value.address),
    country: asStringOrNull(value.country),
    metadata: isRecord(value.metadata) ? value.metadata as JsonObject : null,
    source: asStringOrNull(value.source),
    externalId: asStringOrNull(value.externalId),
    appkitAppId: asStringOrNull(value.appkitAppId),
    sortOrder: asNumber(value.sortOrder),
    isActive: asBoolean(value.isActive),
  };
}

function collectCompanyReferenceIdsFromExperienceRows(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const result = new Set<string>();
  for (const entry of value) {
    if (!isRecord(entry)) continue;

    const explicitId = asUuid(entry.companyReferenceId);
    if (explicitId) {
      result.add(explicitId);
      continue;
    }

    const embeddedId = asUuid(isRecord(entry.companyReference) ? (entry.companyReference as ParsedRecord).id : undefined);
    if (embeddedId) {
      result.add(embeddedId);
    }
  }

  return [...result];
}

function buildCompanyReferenceLookup(companyReferences: CompanyReference[]) {
  const byId: Record<string, CompanyReference> = {};
  const byName = new Map<string, CompanyReference>();

  for (const companyReference of companyReferences) {
    byId[companyReference.id] = companyReference;
    if (companyReference.name) {
      byName.set(companyReference.name.toLowerCase(), companyReference);
    }
  }

  return { byId, byName };
}

function enrichExperienceEntryWithCompanyReference(
  entry: ParsedRecord,
  byId: Record<string, CompanyReference>,
  byName: Map<string, CompanyReference>
) {
  const explicitId = asUuid(entry.companyReferenceId);
  const existingReference = normalizeCompanyReferenceRecord(entry.companyReference);
  const resolvedReference = explicitId
    ? byId[explicitId]
    : existingReference
      ? byName.get(existingReference.name.toLowerCase())
      : null;
  const nameReference = asString(entry.company)
    ? byName.get(asString(entry.company)!.toLowerCase())
    : null;

  if (!resolvedReference && !nameReference) {
    if (explicitId && explicitId !== asString(entry.companyReferenceId)) {
      return {
        ...entry,
        companyReferenceId: explicitId,
      };
    }
    return entry;
  }

  const companyReference = resolvedReference || nameReference;
  if (!companyReference) return entry;

  return {
    ...entry,
    companyReferenceId: companyReference.id,
    companyReference: companyReference,
    company: companyReference.name || entry.company || null,
  };
}

function enrichExperienceListWithCompanyReferences(
  value: unknown,
  byId: Record<string, CompanyReference>,
  byName: Map<string, CompanyReference>
) {
  if (!Array.isArray(value)) return value;

  return value.map((entry) => (
    isRecord(entry) ? enrichExperienceEntryWithCompanyReference(entry, byId, byName) : entry
  ));
}

export type ApplicantDetailApplicantRow = ApplicantDetailRecord & {
  assignmentJustification?: unknown;
  customAttributes?: unknown;
  parsedData?: unknown;
  experienceData?: unknown;
  expectedSalary?: unknown;
  fitScore?: number | null;
  employeeId?: string | null;
  employeeNumber?: string | null;
  positionId?: string | null;
  companyId?: string | null;
  positionTitle?: string | null;
  positionDepartment?: string | null;
  positionCompanyId?: string | null;
  companyLookupId?: string | null;
  companyName?: string | null;
  companyLegalName?: string | null;
  companyLogo?: string | null;
  companyWebsite?: string | null;
  companyDomain?: string | null;
  companyIndustry?: string | null;
  companyDescription?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  companyCountry?: string | null;
  recruiterId?: string | null;
  recruiterName?: string | null;
  recruiterAvatarUrl?: string | null;
  sourceId?: string | null;
  sourceName?: string | null;
  sourceDescription?: string | null;
  sourceLogo?: string | null;
};

export type ApplicantDetailJobMatchRow = ApplicantDetailRecord & {
  fitScore?: number | null;
  jobTitle?: string | null;
  positionTitle?: string | null;
};

export type ApplicantDetailAttachmentRow = ApplicantDetailRecord;

export interface ApplicantDetailResponseInput {
  applicant: ApplicantDetailApplicantRow;
  jobMatches: ApplicantDetailJobMatchRow[];
  attachments: ApplicantDetailAttachmentRow[];
  userReadStatus: boolean | null;
  lite: boolean;
  companyReferences?: CompanyReference[];
}

export interface ApplicantUpdateResponseInput {
  applicant: ApplicantDetailApplicantRow;
  customAttributes: Record<string, unknown>;
  jobMatches: ApplicantDetailJobMatchRow[];
  attachments: ApplicantDetailAttachmentRow[];
  userReadStatus: boolean | null;
  recruiterSync: unknown;
  headcountAssignment: unknown;
  companyReferences?: CompanyReference[];
}

export function collectCompanyReferenceIdsFromApplicantExperience(
  payload: {
    parsedData?: unknown;
    experienceData?: unknown;
  }
) {
  const parsedData = isRecord(payload.parsedData) ? payload.parsedData : null;
  return [
    ...collectCompanyReferenceIdsFromExperienceRows(parsedData ? parsedData.experience : undefined),
    ...collectCompanyReferenceIdsFromExperienceRows(payload.experienceData),
  ];
}

export function normalizeCompanyReferences(rows: unknown[]): CompanyReference[] {
  const result: CompanyReference[] = [];
  for (const row of rows) {
    const companyReference = normalizeCompanyReferenceRecord(row);
    if (companyReference) {
      result.push(companyReference);
    }
  }

  return result;
}

export function applyCompanyReferenceEnrichment({
  parsedData,
  experienceData,
  companyReferences,
}: {
  parsedData: unknown;
  experienceData: unknown;
  companyReferences: CompanyReference[];
}) {
  const normalizedCompanyReferences = normalizeCompanyReferences(companyReferences);
  const { byId, byName } = buildCompanyReferenceLookup(normalizedCompanyReferences);

  const parsedDataWithExperience = isRecord(parsedData)
    ? {
      ...parsedData,
      experience: enrichExperienceListWithCompanyReferences(parsedData.experience, byId, byName),
    }
    : parsedData;

  return {
    parsedData: parsedDataWithExperience,
    experienceData: enrichExperienceListWithCompanyReferences(experienceData, byId, byName),
  };
}

export function normalizeApplicantCustomAttributes(value: unknown): Record<string, unknown> {
  if (!value) return {};

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function buildApplicantPositionSummary(applicant: ApplicantDetailApplicantRow) {
  if (!applicant.positionId) return null;

  return {
    title: applicant.positionTitle || null,
    department: applicant.positionDepartment || null,
    companyId: applicant.positionCompanyId || null,
    company: buildApplicantCompanySummary(applicant),
  };
}

export function buildApplicantCompanySummary(applicant: ApplicantDetailApplicantRow) {
  const id = applicant.companyLookupId || applicant.companyId || applicant.positionCompanyId;
  if (!id && !applicant.companyName) return null;

  return {
    id: id || null,
    name: applicant.companyName || null,
    legalName: applicant.companyLegalName || null,
    logo: applicant.companyLogo || null,
    website: applicant.companyWebsite || null,
    domain: applicant.companyDomain || null,
    industry: applicant.companyIndustry || null,
    description: applicant.companyDescription || null,
    email: applicant.companyEmail || null,
    phone: applicant.companyPhone || null,
    address: applicant.companyAddress || null,
    country: applicant.companyCountry || null,
  };
}

export function buildApplicantRecruiterSummary(
  applicant: ApplicantDetailApplicantRow,
  { includeAvatar = false }: { includeAvatar?: boolean } = {}
) {
  if (!applicant.recruiterId) return null;

  return {
    name: applicant.recruiterName || null,
    ...(includeAvatar ? { avatarUrl: applicant.recruiterAvatarUrl || null } : {}),
  };
}

export function buildApplicantSourceSummary(applicant: ApplicantDetailApplicantRow) {
  if (!applicant.sourceId) return null;

  return {
    id: applicant.sourceId,
    name: applicant.sourceName,
    description: applicant.sourceDescription,
    logo: applicant.sourceLogo,
  };
}

export function buildApplicantEmployeeSummary(applicant: ApplicantDetailApplicantRow) {
  if (!applicant.employeeId) return null;

  return {
    id: applicant.employeeId,
    employeeNumber: applicant.employeeNumber || applicant.employeeId,
  };
}

export function normalizeApplicantDetailJobMatch(match: ApplicantDetailJobMatchRow) {
  return {
    ...match,
    fitScore: normalizeNullableFitScore(match.fitScore),
    jobTitle: match.jobTitle || match.positionTitle || null,
    positionTitle: match.positionTitle || match.jobTitle || null,
  };
}

function normalizeNullableFitScore(score: number | null | undefined) {
  return score === null || score === undefined ? null : normalizeFitScore(score);
}

export function buildApplicantDetailResponseData({
  applicant,
  jobMatches,
  attachments,
  userReadStatus,
  lite,
  companyReferences = [],
}: ApplicantDetailResponseInput) {
  const customAttributes = normalizeApplicantCustomAttributes(applicant.customAttributes);
  const { parsedData, experienceData } = applyCompanyReferenceEnrichment({
    parsedData: promoteBuiltInApplicantDetails(applicant.parsedData),
    experienceData: applicant.experienceData,
    companyReferences,
  });

  return {
    ...applicant,
    parsedData,
    experienceData,
    fitScore: normalizeNullableFitScore(applicant.fitScore),
    isRead: userReadStatus,
    companyId: applicant.companyId || applicant.positionCompanyId || null,
    company: buildApplicantCompanySummary(applicant),
    employee: buildApplicantEmployeeSummary(applicant),
    position: buildApplicantPositionSummary(applicant),
    recruiter: buildApplicantRecruiterSummary(applicant, { includeAvatar: true }),
    source: buildApplicantSourceSummary(applicant),
    jobMatches: (jobMatches || []).map(normalizeApplicantDetailJobMatch),
    expectedSalary: applicant.expectedSalary,
    attachmentHistory: attachments,
    custom_attributes: customAttributes,
    customFields: customAttributes,
    _metadata: {
      totalJobMatches: (jobMatches || []).length,
      totalAttachments: attachments.length,
      hasMoreJobMatches: !lite && (jobMatches || []).length === 3,
      hasMoreAttachments: !lite && attachments.length === 2,
    },
  };
}

export function buildApplicantUpdateResponseData({
  applicant,
  customAttributes,
  jobMatches,
  attachments,
  userReadStatus,
  recruiterSync,
  headcountAssignment,
  companyReferences = [],
}: ApplicantUpdateResponseInput) {
  const { parsedData, experienceData } = applyCompanyReferenceEnrichment({
    parsedData: promoteBuiltInApplicantDetails(applicant.parsedData),
    experienceData: applicant.experienceData,
    companyReferences,
  });

  return {
    ...applicant,
    parsedData,
    experienceData,
    assignmentJustification: applicant.assignmentJustification || null,
    customAttributes,
    customFields: customAttributes,
    isRead: userReadStatus,
    companyId: applicant.companyId || applicant.positionCompanyId || null,
    company: buildApplicantCompanySummary(applicant),
    employee: buildApplicantEmployeeSummary(applicant),
    position: buildApplicantPositionSummary(applicant),
    recruiter: buildApplicantRecruiterSummary(applicant),
    source: buildApplicantSourceSummary(applicant),
    jobMatches: jobMatches || [],
    attachmentHistory: attachments || [],
    recruiterSync,
    headcountAssignment,
  };
}
