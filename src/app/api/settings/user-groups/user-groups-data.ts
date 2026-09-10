import { v4 as uuidv4 } from 'uuid';
import { getPool } from '@/lib/db';
import type { UserGroup } from '@/lib/types';
import { normalizePermissions } from './user-groups-permissions';
import type { UserGroupCreateInput } from './user-groups-schema';

export type CreateUserGroupData = UserGroupCreateInput & {
  permissions: ReturnType<typeof normalizePermissions>;
};

export async function fetchUserGroups(): Promise<UserGroup[]> {
  const result = await getPool().query(`
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
    GROUP BY ug.id, ug.name, ug.description, ug.permissions, ug."is_default", ug."is_system_role", ug."createdAt", ug."updatedAt"
    ORDER BY ug."is_system_role" DESC, ug.name ASC
  `);

  return result.rows.map((group: UserGroup) => ({
    ...group,
    permissions: normalizePermissions(group.permissions),
  }));
}

export async function createUserGroup(data: CreateUserGroupData) {
  const id = uuidv4();
  const client = await getPool().connect();

  try {
    const existingGroup = await client.query(
      'SELECT id, name FROM "UserGroup" WHERE name = $1',
      [data.name]
    );

    if (existingGroup.rows.length > 0) {
      return {
        status: 'duplicate' as const,
        existingGroupId: existingGroup.rows[0].id as string,
      };
    }

    if (data.is_default === true) {
      console.log('POST /api/settings/user-groups - Setting new role as default, resetting other roles...');
      await client.query('UPDATE "UserGroup" SET "is_default" = false, "updatedAt" = NOW()');
    }

    const result = await client.query(
      'INSERT INTO "UserGroup" (id, name, description, permissions, "is_default", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [id, data.name, data.description, data.permissions, data.is_default ?? false]
    );

    return { status: 'created' as const, id, group: result.rows[0] };
  } finally {
    client.release();
  }
}
