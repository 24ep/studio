import { safeJsonParse } from '@/lib/utils';
import type {
  ApplicantInitialRow,
  DbDateValue,
  PositionInitialRow,
  RecruitmentStageInitialRow,
} from './applicants-page-initial-types';

export function toIsoString(value: DbDateValue) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  return new Date().toISOString();
}

export function toOptionalIsoString(value: DbDateValue) {
  if (!value) {
    return undefined;
  }

  return toIsoString(value);
}

export function mapApplicantInitialRows(rows: ApplicantInitialRow[]) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || null,
    statusId: row.statusId || '',
    status: row.status || null,
    positionId: row.positionId || null,
    recruiterId: row.recruiterId || null,
    sourceId: row.sourceId || null,
    fitScore: row.fitScore || 0,
    applicationDate: toIsoString(row.applicationDate),
    updatedAt: toOptionalIsoString(row.updatedAt),
    parsedData: safeJsonParse(row.parsedData, {}),
    position: row.positionId && row.positionTitle ? {
      id: row.positionId,
      title: row.positionTitle,
      department: '',
      isOpen: true,
    } : null,
    recruiter: row.recruiterId && row.recruiterName ? {
      id: row.recruiterId,
      name: row.recruiterName,
      email: '',
    } : null,
    source: row.sourceId && row.sourceName ? {
      id: row.sourceId,
      name: row.sourceName,
      allowSubSource: false,
      sortOrder: 0,
      isActive: true,
    } : null,
    isBlacklisted: row.isBlacklisted || false,
    transitionHistory: [],
    jobMatches: [],
    attachments: [],
  }));
}

export function mapPositionInitialRows(rows: PositionInitialRow[]) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    department: row.department || '',
    isOpen: row.isOpen !== false,
    createdAt: toOptionalIsoString(row.createdAt),
    updatedAt: toOptionalIsoString(row.updatedAt),
    recruiterName: row.recruiterName,
    grade: row.gradeName ? {
      id: '',
      name: row.gradeName,
      minLevel: 0,
      maxLevel: 0,
      slaDays: row.gradeSlaDays || 0,
      color: row.gradeColor || null,
      isActive: true,
      sortOrder: 0,
    } : null,
    customAttributes: {},
  }));
}

export function mapRecruitmentStageInitialRows(rows: RecruitmentStageInitialRow[]) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder ?? row.sort_order ?? null,
    isSystem: row.isSystem || false,
    color_badge: row.color_badge,
    description: row.description,
    createdAt: toOptionalIsoString(row.createdAt),
    updatedAt: toOptionalIsoString(row.updatedAt),
  }));
}
