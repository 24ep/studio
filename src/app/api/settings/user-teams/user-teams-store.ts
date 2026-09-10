import type { QueryResultRow } from 'pg';

import { getPool } from '@/lib/db';

import type { UserTeamInput } from './user-teams-schema';

export type UserTeamRow = QueryResultRow & {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  assignmentMode: string;
  assignmentConditions: unknown;
  createdAt: Date;
  updatedAt: Date;
  member_count?: string;
};

export async function fetchUserTeams(): Promise<UserTeamRow[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<UserTeamRow>(`
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
      GROUP BY ut.id, ut.name, ut.description, ut.color, ut."is_active", ut.assignment_mode, ut.assignment_conditions, ut."createdAt", ut."updatedAt"
      ORDER BY ut.name
    `);

    return result.rows;
  } finally {
    client.release();
  }
}

export async function createUserTeam(id: string, input: UserTeamInput): Promise<UserTeamRow> {
  const client = await getPool().connect();
  try {
    const result = await client.query<UserTeamRow>(
      'INSERT INTO "UserTeam" (id, name, description, color, "is_active", "assignment_mode", "assignment_conditions") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, input.name, input.description, input.color, input.isActive, input.assignmentMode, JSON.stringify(input.assignmentConditions)]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}
