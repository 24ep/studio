import { NextResponse } from 'next/server';
import type { QueryResultRow } from 'pg';
import { getPool } from '@/lib/db';

export type PositionDetailRow = QueryResultRow & {
  id: string;
  title: string;
  department?: string | null;
  description?: string | null;
  matchCriteria?: unknown;
  isOpen?: boolean | null;
  positionLevel?: string | null;
  positionAttribute?: unknown;
  probationPeriodDays?: number | null;
  probationEvaluationFrequencyDays?: number | null;
  gradeId?: string | null;
  recruiterId?: string | null;
  customAttributes?: unknown;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  recruiterName?: string | null;
  applicantTotal?: number | string | null;
  shortlistedCount?: number | string | null;
  interviewCount?: number | string | null;
  offerCount?: number | string | null;
  hiringTeamCount?: number | string | null;
  gradeName?: string | null;
  gradeLabel?: string | null;
  gradeSlaDays?: number | null;
  gradeColor?: string | null;
};

type PositionStatisticsRow = QueryResultRow & {
  total: string;
  open: string;
  closed: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const POSITION_DETAIL_SELECT = `
  SELECT
    p.id,
    p.title,
    p.department,
    p.description,
    p."matchCriteria",
    p."isOpen",
    p."positionLevel",
    p."positionAttribute",
    p."probation_period_days" AS "probationPeriodDays",
    p."probation_evaluation_frequency_days" AS "probationEvaluationFrequencyDays",
    p."gradeId",
    p."recruiterId",
    p."customAttributes",
    p."createdAt",
    p."updatedAt",
    u.name as "recruiterName",
    (
      SELECT COUNT(*)::int
      FROM "Applicant" a
      WHERE a."positionId" = p.id
    ) AS "applicantTotal",
    (
      SELECT COUNT(*)::int
      FROM "Applicant" a
      LEFT JOIN "RecruitmentStage" rs ON a."statusId" = rs.id
      WHERE a."positionId" = p.id AND LOWER(COALESCE(rs.name, '')) LIKE '%shortlist%'
    ) AS "shortlistedCount",
    (
      SELECT COUNT(*)::int
      FROM "Applicant" a
      LEFT JOIN "RecruitmentStage" rs ON a."statusId" = rs.id
      WHERE a."positionId" = p.id AND LOWER(COALESCE(rs.name, '')) LIKE '%interview%'
    ) AS "interviewCount",
    (
      SELECT COUNT(*)::int
      FROM "Applicant" a
      LEFT JOIN "RecruitmentStage" rs ON a."statusId" = rs.id
      WHERE a."positionId" = p.id AND LOWER(COALESCE(rs.name, '')) LIKE '%offer%'
    ) AS "offerCount",
    (
      SELECT COUNT(*)::int
      FROM "PositionInterviewer" pi
      WHERE pi."positionId" = p.id
    ) AS "hiringTeamCount",
    g.name as "gradeName",
    g.label as "gradeLabel",
    g."sla_days" as "gradeSlaDays",
    g.color as "gradeColor"
  FROM "Position" p
  LEFT JOIN "User" u ON p."recruiterId" = u.id
  LEFT JOIN "Grade" g ON p."gradeId" = g.id
  WHERE p.id = $1
`;

export function shapePositionDetail(position: PositionDetailRow) {
  return {
    ...position,
    custom_attributes: position.customAttributes || {},
    recruiterName: position.recruiterName || null,
    pipelineStats: {
      total: Number(position.applicantTotal) || 0,
      shortlisted: Number(position.shortlistedCount) || 0,
      interviews: Number(position.interviewCount) || 0,
      offers: Number(position.offerCount) || 0,
    },
    hiringTeamCount: Number(position.hiringTeamCount) || 0,
    grade: position.gradeId ? {
      id: position.gradeId,
      name: position.gradeName,
      label: position.gradeLabel,
      slaDays: position.gradeSlaDays,
      color: position.gradeColor,
    } : null,
  };
}

export async function connectPositionDb() {
  try {
    return await getPool().connect();
  } catch (connectionError: unknown) {
    console.error('[Positions API] Failed to connect to database:', connectionError);
    return NextResponse.json({
      message: 'Database connection error',
      error: getErrorMessage(connectionError),
    }, { status: 500 });
  }
}

export async function getPositionStatistics() {
  const statsResult = await getPool().query<PositionStatisticsRow>(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN "isOpen" = TRUE THEN 1 END) as open,
      COUNT(CASE WHEN "isOpen" = FALSE THEN 1 END) as closed
    FROM "Position"
  `);
  const stats = statsResult.rows[0];

  return {
    total: parseInt(stats.total, 10),
    open: parseInt(stats.open, 10),
    closed: parseInt(stats.closed, 10),
  };
}
