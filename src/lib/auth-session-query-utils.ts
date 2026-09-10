import { buildSessionUser, getErrorDiagnostics } from "@/lib/auth-utils-results";
import { getPool } from "@/lib/db";
import { expandPermissionSet } from "@/lib/permission-aliases";
import type { PlatformModuleId } from "@/lib/types";

interface SessionUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  avatarUrl?: string | null;
  personal_color?: string | null;
  is_active: boolean;
  two_factor_enabled: boolean;
  two_factor_method?: string | null;
}

export async function getUserSessionData(userId: string) {
  const client = await getPool().connect();
  try {
    const result = await client.query<SessionUserRow>(`
      SELECT 
        u.id, u.name, u.email, u.role, u.image,
        u."avatarUrl", u."personal_color", u."is_active",
        u."two_factor_enabled", u."two_factor_method"
      FROM "User" u 
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return buildSessionUser(result.rows[0]);
  } catch (error) {
    console.error("[AUTH UTILS] Get user session data error:", getErrorDiagnostics(error, userId));
    return null;
  } finally {
    client.release();
  }
}

export async function getUserPermissions(userId: string): Promise<PlatformModuleId[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<{ permission?: unknown }>(`
      SELECT DISTINCT unnest(ug.permissions) AS permission
      FROM "User" u
      JOIN "UserGroup" ug ON u."userGroupId" = ug.id
      WHERE u.id = $1
    `, [userId]);

    return expandPermissionSet(
      result.rows
        .map((row) => row.permission)
        .filter((permission): permission is PlatformModuleId => typeof permission === "string"),
    );
  } catch (error) {
    console.error("[AUTH UTILS] Get user permissions error:", getErrorDiagnostics(error, userId));
    return [];
  } finally {
    client.release();
  }
}
