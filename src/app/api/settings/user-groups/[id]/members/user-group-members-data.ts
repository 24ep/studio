import type { PoolClient } from 'pg';
import { clearUserFullContextCache } from '@/lib/authUtils';

export type UserGroupMemberGroup = {
  id: string;
  name: string;
};

export type UserGroupMemberUser = {
  id: string;
  name: string;
};

export async function fetchUserGroup(client: PoolClient, groupId: string): Promise<UserGroupMemberGroup | null> {
  const groupCheck = await client.query('SELECT id, name FROM "UserGroup" WHERE id = $1', [groupId]);
  return groupCheck.rows[0] ?? null;
}

export async function fetchUser(client: PoolClient, userId: string): Promise<UserGroupMemberUser | null> {
  const userCheck = await client.query('SELECT id, name FROM "User" WHERE id = $1', [userId]);
  return userCheck.rows[0] ?? null;
}

export async function fetchGroupMembers(client: PoolClient, groupId: string) {
  const result = await client.query(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      u."avatarUrl",
      u."personal_color",
      u."createdAt"
    FROM "User" u
    WHERE u."userGroupId" = $1
    ORDER BY u.name ASC
  `, [groupId]);

  return result.rows;
}

export async function userBelongsToGroup(client: PoolClient, userId: string, groupId: string) {
  const existingMembership = await client.query(
    'SELECT id FROM "User" WHERE id = $1 AND "userGroupId" = $2',
    [userId, groupId]
  );

  return existingMembership.rows.length > 0;
}

export async function addUserToGroup(client: PoolClient, groupId: string, userId: string) {
  await client.query('UPDATE "User" SET "userGroupId" = $1 WHERE id = $2', [groupId, userId]);
  clearUserFullContextCache();
}

export async function removeUserFromGroup(client: PoolClient, userId: string) {
  await client.query('UPDATE "User" SET "userGroupId" = NULL WHERE id = $1', [userId]);
  clearUserFullContextCache();
}
