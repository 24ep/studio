import { getPool } from './db';
import type { Applicant, Position, RecruitmentStage, UserProfile } from './types';
import { normalizeFitScore } from './scoreUtils';
import { ensureRequiredRecruitmentStages } from './recruitment-stage-system';

type DashboardApplicantRow = Applicant & { fitScore: number | null };
type PositionRow = Position & { customAttributes?: unknown };
type ApplicantListRow = Applicant & {
  customAttributes?: unknown;
  positionTitle?: string | null;
  recruiterName?: string | null;
  recruiterAvatarUrl?: string | null;
};

export async function fetchAllPositionsDb(): Promise<Position[]> {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT * FROM "Position" ORDER BY title ASC');
    return result.rows;
  } catch (error) {
    console.error("Error fetching all positions from DB:", error);
    throw error;
  }
}

export async function fetchAllRecruitmentStagesDb(): Promise<RecruitmentStage[]> {
  const pool = getPool();
  try {
    await ensureRequiredRecruitmentStages(pool);
    const result = await pool.query('SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC');
    return result.rows;
  } catch (error) {
    console.error("Error fetching all recruitment stages from DB:", error);
    throw error;
  }
}

export async function fetchAllUsersDb(filterRole?: UserProfile['role']): Promise<UserProfile[]> {
  const pool = getPool();
  try {
    let query = 'SELECT id, name, email, role, image as "avatarUrl" FROM "User"';
    const queryParams = [];
    if (filterRole) {
      query += ' WHERE role = $1';
      queryParams.push(filterRole);
    }
    query += ' ORDER BY name ASC';
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching users from DB (role: ${filterRole || 'all'}):`, error);
    throw error;
  }
}

export async function fetchInitialDashboardApplicantsDb(limit: number = 10): Promise<Applicant[]> {
  const pool = getPool();
  try {
    const query = `
      SELECT id, name, email, phone, "positionId", "recruiterId", "fitScore", "statusId", "applicationDate", "parsedData", "customAttributes", "resumePath", "createdAt", "updatedAt"
      FROM "Applicant"
      ORDER BY "createdAt" DESC
      LIMIT $1;
    `;
    const result = await pool.query(query, [limit]);
    return (result.rows as DashboardApplicantRow[]).map((row) => ({
      ...row,
      fitScore: normalizeFitScore(row.fitScore),
    }));
  } catch (error) {
    console.error("Error fetching initial dashboard Applicants from DB:", error);
    throw error;
  }
}

export async function getAllPositions() {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM "Position" ORDER BY title ASC');
  return (result.rows as PositionRow[]).map((row) => ({
    ...row,
    customAttributes: row.customAttributes || {},
  }));
}

export async function getAllUsers() {
  const pool = getPool();
  const query = 'SELECT id, name, email, role, image as "avatarUrl" FROM "User"';
  const result = await pool.query(query);
  return result.rows;
}

export async function getAllApplicants() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT c.*, p.title as "positionTitle", r.name as "recruiterName", r."avatarUrl" as "recruiterAvatarUrl"
    FROM "Applicant" c
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" r ON c."recruiterId" = r.id
    ORDER BY c."applicationDate" DESC
  `);
  return (result.rows as ApplicantListRow[]).map((row) => ({
    ...row,
    customAttributes: row.customAttributes || {},
    position: row.positionId ? { title: row.positionTitle } : null,
    recruiter: row.recruiterId ? {
      name: row.recruiterName,
      avatarUrl: row.recruiterAvatarUrl || null,
    } : null,
  }));
}
