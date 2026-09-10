import { getPool, type DbClient } from '@/lib/db';
import { clearUserFullContextCache } from '@/lib/authUtils';

export type { DbClient };

export type UserTeamMemberTeam = {
  name: string;
};

export type UserTeamMemberUser = {
  name: string;
};

export async function connectUserTeamMembersClient() {
  return getPool().connect();
}

export function releaseUserTeamMembersClient(client: DbClient) {
  client.release();
}

export async function fetchUserTeam(client: DbClient, teamId: string): Promise<UserTeamMemberTeam | null> {
  const teamExists = await client.query<UserTeamMemberTeam>('SELECT name FROM "UserTeam" WHERE id = $1', [teamId]);
  return teamExists.rows[0] ?? null;
}

export async function fetchUser(client: DbClient, userId: string): Promise<UserTeamMemberUser | null> {
  const userExists = await client.query<UserTeamMemberUser>('SELECT name FROM "User" WHERE id = $1', [userId]);
  return userExists.rows[0] ?? null;
}

export async function fetchTeamMembers(client: DbClient, teamId: string) {
  const result = await client.query(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      u."createdAt"
    FROM "User" u
    WHERE u."userTeamId" = $1
    ORDER BY u.name ASC
  `, [teamId]);

  return result.rows;
}

export async function userBelongsToTeam(client: DbClient, userId: string, teamId: string) {
  const existingMembership = await client.query(
    'SELECT 1 FROM "User" WHERE id = $1 AND "userTeamId" = $2',
    [userId, teamId],
  );

  return existingMembership.rows.length > 0;
}

export async function addUserToTeam(client: DbClient, teamId: string, userId: string) {
  await client.query('UPDATE "User" SET "userTeamId" = $1 WHERE id = $2', [teamId, userId]);
  clearUserFullContextCache();
}

export async function removeUserFromTeam(client: DbClient, userId: string) {
  await client.query('UPDATE "User" SET "userTeamId" = NULL WHERE id = $1', [userId]);
  clearUserFullContextCache();
}
