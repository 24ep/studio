import { getPool } from './db-pool';
import { expandPermissionSet } from './permission-aliases';

export async function getMergedUserPermissions(userId: string): Promise<string[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `
      SELECT ug.permissions
      FROM "User" u
      JOIN "UserGroup" ug ON u."userGroupId" = ug.id
      WHERE u.id = $1
    `,
      [userId],
    );

    if (result.rows.length === 0) {
      return [];
    }

    return expandPermissionSet(result.rows[0].permissions || []);
  } catch (error) {
    console.error('Error getting merged user permissions:', error);
    return [];
  } finally {
    client.release();
  }
}
