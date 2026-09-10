import type { AuthQueryClient } from "./auth-query-types";
import { expandPermissionSet } from "./permission-aliases";

export interface AuthUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  password?: string | null;
  avatarUrl?: string | null;
  personal_color?: string | null;
  is_active: boolean;
  two_factor_enabled: boolean;
  two_factor_secret?: string | null;
  two_factor_method?: string | null;
  two_factor_backup_codes?: unknown;
  authentication_methods?: unknown;
  force_password_change?: boolean;
}

interface PermissionRow {
  permissions?: unknown;
}

export async function fetchAuthUserByEmail(client: AuthQueryClient, email: string) {
  const userResult = await client.query<AuthUserRow>(`
    SELECT
      u.id, u.name, u.email, u.role, u.image, u.password,
      u."avatarUrl", u."personal_color", u."is_active",
      u."failed_login_attempts", u."locked_until", u."last_failed_login",
      u."two_factor_enabled", u."two_factor_secret", u."two_factor_method", u."two_factor_backup_codes",
      u."authentication_methods", u."force_password_change"
    FROM "User" u
    WHERE u.email = $1
  `, [email]);

  return userResult.rows[0] ?? null;
}

export async function fetchAuthUserPermissions(client: AuthQueryClient, userId: string) {
  const permissionsResult = await client.query<PermissionRow>(`
    SELECT ug.permissions
    FROM "User" u
    JOIN "UserGroup" ug ON u."userGroupId" = ug.id
    WHERE u.id = $1
  `, [userId]);

  return normalizeAuthPermissions(permissionsResult.rows[0]?.permissions);
}

export function normalizeAuthPermissions(rawPermissions: unknown) {
  const permissions = Array.isArray(rawPermissions)
    ? rawPermissions.filter((permission): permission is string => typeof permission === "string")
    : [];

  return expandPermissionSet(permissions);
}

export async function logSuccessfulLogin(client: AuthQueryClient, userId: string) {
  await client.query(`
    INSERT INTO "UserActivityLog" (id, user_id, action, details, created_at)
    VALUES (gen_random_uuid(), $1, 'SIGN_IN', $2, NOW())
  `, [userId, JSON.stringify({ method: "credentials" })]);
}
