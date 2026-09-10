import { getPool } from '@/lib/db';
import type { UserTeamUpdateInput } from './user-team-detail-schema';

export async function fetchUserTeamDetail(id: string) {
  const client = await getPool().connect();

  try {
    const result = await client.query(`
      SELECT 
        ut.id,
        ut.name,
        ut.description,
        ut.color,
        ut."is_active" as "isActive",
        ut.assignment_mode as "assignmentMode",
        ut.assignment_conditions as "assignmentConditions",
        ut."createdAt",
        ut."updatedAt",
        COUNT(u.id) as member_count
      FROM "UserTeam" ut
      LEFT JOIN "User" u ON ut.id = u."userTeamId"
      WHERE ut.id = $1
      GROUP BY ut.id, ut.name, ut.description, ut.color, ut."is_active", ut.assignment_mode, ut.assignment_conditions, ut."createdAt", ut."updatedAt"
    `, [id]);

    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function updateUserTeam(id: string, input: UserTeamUpdateInput) {
  const client = await getPool().connect();

  try {
    const existingTeam = await client.query('SELECT name FROM "UserTeam" WHERE id = $1', [id]);
    if (existingTeam.rows.length === 0) {
      return null;
    }

    const result = await client.query(
      'UPDATE "UserTeam" SET name = $1, description = $2, color = $3, "is_active" = $4, "assignment_mode" = $5, "assignment_conditions" = $6, "updatedAt" = NOW() WHERE id = $7 RETURNING *',
      [input.name, input.description, input.color, input.isActive ?? true, input.assignmentMode, JSON.stringify(input.assignmentConditions), id]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function deleteUserTeam(id: string) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const existingTeam = await client.query('SELECT name FROM "UserTeam" WHERE id = $1', [id]);
    if (existingTeam.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const teamName = existingTeam.rows[0].name;
    await client.query('UPDATE "User" SET "userTeamId" = NULL WHERE "userTeamId" = $1', [id]);
    await client.query('DELETE FROM "UserTeam" WHERE id = $1', [id]);
    await client.query('COMMIT');

    return { name: teamName };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
