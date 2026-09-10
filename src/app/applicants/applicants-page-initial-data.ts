import { getPool } from '@/lib/db';
import type { PoolClient } from 'pg';
import { getApplicantsPageErrorDiagnostics } from './applicants-page-initial-errors';
import {
  mapApplicantInitialRows,
  mapPositionInitialRows,
  mapRecruitmentStageInitialRows,
} from './applicants-page-initial-mappers';
import type {
  ApplicantInitialRow,
  ApplicantsPageInitialData,
  PositionInitialRow,
  RecruitmentStageInitialRow,
} from './applicants-page-initial-types';

const EMPTY_APPLICANTS_PAGE_INITIAL_DATA: ApplicantsPageInitialData = {
  initialApplicants: [],
  initialAvailablePositions: [],
  initialAvailableStages: [],
};

export async function getApplicantsPageInitialData(): Promise<ApplicantsPageInitialData> {
  let client: PoolClient | null = null;

  try {
    client = await getPool().connect();

    const [applicantRows, positionRows, stageRows] = await Promise.all([
      queryInitialApplicants(client),
      queryInitialPositions(client),
      queryInitialRecruitmentStages(client),
    ]);

    return {
      initialApplicants: mapApplicantInitialRows(applicantRows),
      initialAvailablePositions: mapPositionInitialRows(positionRows),
      initialAvailableStages: mapRecruitmentStageInitialRows(stageRows),
    };
  } catch (error) {
    const diagnostics = getApplicantsPageErrorDiagnostics(error);
    console.error('Error fetching initial data:', error);
    console.error('Error details:', diagnostics);

    return {
      ...EMPTY_APPLICANTS_PAGE_INITIAL_DATA,
      initialFetchError: `Failed to load initial data: ${diagnostics.message}`,
    };
  } finally {
    if (client) {
      releaseApplicantsPageClient(client);
    }
  }
}

async function queryInitialApplicants(client: PoolClient): Promise<ApplicantInitialRow[]> {
  try {
    const result = await client.query<ApplicantInitialRow>(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c."statusId",
        rs.name as "status",
        c."positionId",
        c."recruiterId",
        c."sourceId",
        c."fitScore",
        c."applicationDate",
        c."updatedAt",
        c."parsedData",
        p.title as "positionTitle",
        r.name as "recruiterName",
        cs.name as "sourceName",
        c."isBlacklisted"
      FROM "Applicant" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" r ON c."recruiterId" = r.id
      LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
      LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
      ORDER BY c."applicationDate" DESC
      LIMIT 50;
    `);

    return result.rows;
  } catch (error) {
    console.error('Error fetching Applicants:', error);
    throw error;
  }
}

async function queryInitialPositions(client: PoolClient): Promise<PositionInitialRow[]> {
  try {
    const result = await client.query<PositionInitialRow>(`
      SELECT 
        p.id,
        p.title,
        p.department,
        p."isOpen",
        p."createdAt",
        p."updatedAt",
        u.name as "recruiterName",
        g.name as "gradeName",
        g."sla_days" as "gradeSlaDays",
        g.color as "gradeColor"
      FROM "Position" p 
      LEFT JOIN "User" u ON p."recruiterId" = u.id
      LEFT JOIN "Grade" g ON p."gradeId" = g.id
      WHERE p."isOpen" = true
      ORDER BY p."createdAt" DESC;
    `);

    return result.rows;
  } catch (error) {
    console.error('Error fetching positions:', error);
    throw error;
  }
}

async function queryInitialRecruitmentStages(client: PoolClient): Promise<RecruitmentStageInitialRow[]> {
  try {
    const result = await client.query<RecruitmentStageInitialRow>(
      'SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC;'
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching recruitment stages:', error);
    throw error;
  }
}

function releaseApplicantsPageClient(client: PoolClient) {
  try {
    client.release();
  } catch (releaseError) {
    console.error('Error releasing database client:', releaseError);
  }
}
