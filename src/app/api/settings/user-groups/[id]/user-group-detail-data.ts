import { getPool } from '@/lib/db';
import type { UserGroup } from '@/lib/types';
import { clearUserFullContextCache } from '@/lib/authUtils';
import { normalizePermissions } from './user-group-detail-permissions';
import type { UserGroupUpdateInput } from './user-group-detail-schema';

export async function fetchUserGroupDetail(id: string): Promise<UserGroup | null> {
  const groupResult = await getPool().query(`
    SELECT 
      ug.id, 
      ug.name, 
      ug.description, 
      ug.permissions,
      ug."is_default" as "isDefault", 
      ug."is_system_role" as "isSystemRole",
      ug."createdAt", 
      ug."updatedAt",
      COUNT(u.id)::int as user_count
    FROM "UserGroup" ug
    LEFT JOIN "User" u ON ug.id = u."userGroupId"
    WHERE ug.id = $1
    GROUP BY ug.id, ug.name, ug.description, ug.permissions, ug."is_default", ug."is_system_role", ug."createdAt", ug."updatedAt"
  `, [id]);

  if (groupResult.rows.length === 0) {
    return null;
  }

  return {
    ...groupResult.rows[0],
    permissions: normalizePermissions(groupResult.rows[0].permissions),
  };
}

export async function updateUserGroup(id: string, fields: UserGroupUpdateInput) {
  const client = await getPool().connect();

  try {
    const checkResult = await client.query('SELECT "is_system_role" FROM "UserGroup" WHERE id = $1', [id]);
    if (checkResult.rowCount === 0) {
      return { status: 'not-found' as const };
    }

    if (checkResult.rows[0].is_system_role === true) {
      return { status: 'system-role' as const };
    }

    if (fields.is_default === true) {
      await client.query('UPDATE "UserGroup" SET "is_default" = false, "updatedAt" = NOW() WHERE id != $1', [id]);
    }

    const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`);
    const queryParams = Object.values(fields);
    const result = await client.query(`
      UPDATE "UserGroup" 
      SET ${setClauses.join(', ')}, "updatedAt" = NOW() 
      WHERE id = $${queryParams.length + 1}
      RETURNING *;
    `, [...queryParams, id]);

    if (result.rowCount === 0) {
      return { status: 'not-found' as const };
    }

    clearUserFullContextCache();
    return {
      status: 'updated' as const,
      group: {
        ...result.rows[0],
        permissions: normalizePermissions(result.rows[0].permissions),
      },
    };
  } finally {
    client.release();
  }
}

export async function deleteUserGroup(id: string) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    await client.query('UPDATE "User" SET "userGroupId" = NULL WHERE "userGroupId" = $1', [id]);
    const result = await client.query('DELETE FROM "UserGroup" WHERE id = $1 RETURNING name', [id]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
