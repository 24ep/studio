import type { DashboardMetrics } from '../../components/dashboard/DashboardPageClient';
import type { Applicant, Position, UserProfile } from '../../lib/types';
import { safeJsonParse } from '../../lib/utils/core';

export type DashboardDateValue = Date | string | null | undefined;

export interface DashboardApplicantRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dataAiHint?: string | null;
  resumePath?: string | null;
  parsedData?: unknown;
  customAttributes?: unknown;
  fitScore?: number | null;
  applicationDate?: DashboardDateValue;
  createdAt?: DashboardDateValue;
  updatedAt?: DashboardDateValue;
  positionId?: string | null;
  positionTitle?: string | null;
  positionDepartment?: string | null;
  positionLevel?: string | null;
  positionIsOpen?: boolean | null;
  recruiterId?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  recruiterAvatarUrl?: string | null;
  statusId?: string | null;
  statusName?: string | null;
}

export interface DashboardPositionRow {
  id: string;
  title: string;
  department: string;
  isOpen: boolean;
  positionLevel?: string | null;
  createdAt?: DashboardDateValue;
  updatedAt?: DashboardDateValue;
}

export interface DashboardUserRow {
  id: string;
  name: string;
  email: string;
  role: UserProfile['role'];
  avatarUrl?: string | null;
  createdAt?: DashboardDateValue;
  updatedAt?: DashboardDateValue;
}

export interface DashboardStageRow {
  id: string;
  name: string;
}

export const DASHBOARD_APPLICANTS_QUERY = `
  SELECT c.id, c.name, c.email, c.phone, c."avatarUrl", c."dataAiHint", c."resumePath", c."parsedData", c."customAttributes", c."fitScore", c."applicationDate", c."createdAt", c."updatedAt",
         p.id as "positionId", p.title as "positionTitle", p.department as "positionDepartment", p."positionLevel" as "positionLevel", p."isOpen" as "positionIsOpen",
         r.id as "recruiterId", r.name as "recruiterName", r.email as "recruiterEmail", r."avatarUrl" as "recruiterAvatarUrl",
         rs.id as "statusId", rs.name as "statusName"
  FROM "Applicant" c
  LEFT JOIN "Position" p ON c."positionId" = p.id
  LEFT JOIN "User" r ON c."recruiterId" = r.id
  LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
  WHERE ($1 = true OR c."recruiterId" = $2 OR c."recruiterId" IS NULL)
  ORDER BY c."applicationDate" DESC
  LIMIT 200;
`;

export const DASHBOARD_POSITIONS_QUERY = 'SELECT * FROM "Position" ORDER BY "createdAt" DESC;';
export const DASHBOARD_USERS_QUERY = 'SELECT id, name, email, role, "avatarUrl", "createdAt", "updatedAt" FROM "User" ORDER BY "createdAt" DESC;';
export const DASHBOARD_STAGES_QUERY = 'SELECT id, name FROM "RecruitmentStage" ORDER BY "sort_order" ASC;';

const DASHBOARD_STAGE_ALIASES: Record<string, string> = {
  applied: 'applied',
  screening: 'screening',
  shortlisted: 'shortlisted',
  'interview scheduled': 'interviewScheduled',
  interviewing: 'interviewing',
  'offer extended': 'offerExtended',
  'on hold': 'onHold',
  hired: 'hired',
  rejected: 'rejected',
};

export function createDefaultDashboardMetrics(): DashboardMetrics {
  return {
    kpis: {
      activeApplicants: 0,
      openHeadcounts: 0,
      hiredThisMonth: 0,
      rejectedThisMonth: 0,
      highScoreApplicants: 0,
      applicationsThisWeek: 0,
      avgTimeToHire: '0.00',
    },
    timeSeries: [],
    scoreDistribution: [],
    pipelineStages: [],
    pipelineRecruiters: [],
  };
}

export function toDashboardIsoDate(value: DashboardDateValue) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  return new Date().toISOString();
}

export function mapDashboardApplicants(rows: DashboardApplicantRow[]): Applicant[] {
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || null,
    avatarUrl: row.avatarUrl || null,
    dataAiHint: row.dataAiHint || null,
    resumePath: row.resumePath || null,
    parsedData: safeJsonParse(row.parsedData, { personal_info: { firstname: '', lastname: '' }, contact_info: { email: '' } }),
    customAttributes: safeJsonParse(row.customAttributes, {}),
    positionId: row.positionId || null,
    position: row.positionId ? {
      id: row.positionId,
      title: row.positionTitle || '',
      department: row.positionDepartment || '',
      positionLevel: row.positionLevel,
      isOpen: row.positionIsOpen || false,
    } : null,
    fitScore: row.fitScore || 0,
    statusId: row.statusId || '',
    status: row.statusName || 'Unknown',
    applicationDate: toDashboardIsoDate(row.applicationDate),
    recruiterId: row.recruiterId || null,
    recruiter: row.recruiterId ? {
      id: row.recruiterId,
      name: row.recruiterName || '',
      email: row.recruiterEmail || '',
      avatarUrl: row.recruiterAvatarUrl || null,
    } : null,
    createdAt: toDashboardIsoDate(row.createdAt),
    updatedAt: toDashboardIsoDate(row.updatedAt),
    transitionHistory: [],
  }));
}

export function mapDashboardPositions(rows: DashboardPositionRow[]): Position[] {
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    department: row.department,
    isOpen: row.isOpen,
    positionLevel: row.positionLevel,
    createdAt: toDashboardIsoDate(row.createdAt),
    updatedAt: toDashboardIsoDate(row.updatedAt),
  }));
}

export function mapDashboardUsers(rows: DashboardUserRow[]): UserProfile[] {
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatarUrl || undefined,
    createdAt: toDashboardIsoDate(row.createdAt),
    updatedAt: toDashboardIsoDate(row.updatedAt),
  }));
}

export function mapDashboardStages(rows: DashboardStageRow[]) {
  const stageIds: Record<string, string | undefined> = {};
  const stageNames: Record<string, string> = {};

  rows.forEach(row => {
    const name = row.name.toLowerCase();
    const alias = DASHBOARD_STAGE_ALIASES[name];

    stageIds[name] = row.id;
    stageNames[row.id] = row.name;

    if (alias) {
      stageIds[alias] = row.id;
    }
  });

  return { stageIds, stageNames };
}
