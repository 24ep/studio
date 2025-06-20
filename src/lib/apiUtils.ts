// src/lib/apiUtils.ts
import pool from './db';
import type { Position, RecruitmentStage, Candidate, UserProfile } from './types';

export async function fetchAllPositionsDb(): Promise<Position[]> {
  try {
    const result = await pool.query('SELECT id, title, department, description, "isOpen", position_level, custom_attributes, "createdAt", "updatedAt" FROM "Position" ORDER BY title ASC');
    return result.rows.map(row => ({
      ...row,
      custom_attributes: row.custom_attributes || {},
    }));
  } catch (error) {
    console.error("Error fetching all positions from DB:", error);
    throw error; // Re-throw to be caught by the server component
  }
}

export async function fetchAllRecruitmentStagesDb(): Promise<RecruitmentStage[]> {
  try {
    const result = await pool.query('SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC');
    return result.rows;
  } catch (error) {
    console.error("Error fetching all recruitment stages from DB:", error);
    throw error;
  }
}

export async function fetchAllUsersDb(filterRole?: UserProfile['role']): Promise<UserProfile[]> {
  try {
    let query = 'SELECT id, name, email, role, "avatarUrl", "dataAiHint" FROM "User"';
    const queryParams = [];
    if (filterRole) {
      query += ' WHERE role = $1';
      queryParams.push(filterRole);
    }
    query += ' ORDER BY name ASC';
    const result = await pool.query(query, queryParams);
    return result.rows.map(user => ({
      ...user,
      // Ensure modulePermissions and groups are initialized if not present,
      // though this query doesn't fetch them.
      modulePermissions: user.modulePermissions || [],
      groups: user.groups || [],
    }));
  } catch (error) {
    console.error(`Error fetching users from DB (role: ${filterRole || 'all'}):`, error);
    throw error;
  }
}


// Fetch initial candidates for dashboard or other general views
// This is a simplified version. For full filtering like in /api/candidates, more complex logic is needed.
export async function fetchInitialDashboardCandidatesDb(limit: number = 10): Promise<Candidate[]> {
  try {
    const query = `
      SELECT
        c.id, c.name, c.email, c.phone, c."avatarUrl", c."dataAiHint", c."resumePath", c."parsedData", c.custom_attributes,
        c."positionId", c."fitScore", c.status, c."applicationDate",
        c."recruiterId", c."createdAt", c."updatedAt",
        p.title as "positionTitle", p.department as "positionDepartment", p.position_level as "positionLevel",
        rec.name as "recruiterName"
        -- Note: transitionHistory is omitted here for dashboard performance, fetch on detail page
      FROM "Candidate" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" rec ON c."recruiterId" = rec.id
      ORDER BY c."applicationDate" DESC, c."createdAt" DESC
      LIMIT $1;
    `;
    const result = await pool.query(query, [limit]);
    return result.rows.map(row => ({
      ...row,
      parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
      custom_attributes: row.custom_attributes || {},
      position: row.positionId ? { id: row.positionId, title: row.positionTitle, department: row.positionDepartment, position_level: row.positionLevel } : null,
      recruiter: row.recruiterId ? { id: row.recruiterId, name: row.recruiterName, email: null } : null,
      transitionHistory: [], // Default to empty for dashboard list
    }));
  } catch (error) {
    console.error("Error fetching initial dashboard candidates from DB:", error);
    throw error;
  }
}
