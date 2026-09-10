import { getPool } from './db';
import {
  deleteCachedUserFullContext,
  getCachedUserFullContext,
  setCachedUserFullContext,
  type UserFullContextResult,
} from './auth-session-context-cache';
import {
  buildUserFullContextResult,
  getFullContextInvalidResult,
  shouldUpdateSessionActivity,
} from './auth-session-management-utils';
import type { UserFullContextRow } from './auth-session-management-types';

/**
 * Optimized function to fetch all user context in a single query.
 */
export async function getUserFullContext(sessionToken: string): Promise<UserFullContextResult> {
  const cached = getCachedUserFullContext(sessionToken);
  if (cached) {
    return cached;
  }

  const client = await getPool().connect();
  try {
    const result = await client.query<UserFullContextRow>(`
      SELECT
        s.id as session_id, s.user_id, s.is_active as session_active, s.expires_at, s.last_activity_at,
        u.name, u.email, u.role, u.image, u."avatarUrl", u."personal_color",
        u."is_active" as user_active, u."two_factor_enabled", u."two_factor_method",
        ug.permissions
      FROM "UserSession" s
      JOIN "User" u ON s.user_id = u.id
      LEFT JOIN "UserGroup" ug ON u."userGroupId" = ug.id
      WHERE s.session_token = $1
    `, [sessionToken]);

    if (result.rows.length === 0) {
      return { isValid: false, reason: 'NOT_FOUND' };
    }

    const row = result.rows[0];
    const invalidResult = getFullContextInvalidResult(row);
    if (invalidResult) {
      return invalidResult;
    }

    if (shouldUpdateSessionActivity(row.last_activity_at)) {
      await client.query('UPDATE "UserSession" SET last_activity_at = NOW() WHERE id = $1', [row.session_id]);
    }

    const response = buildUserFullContextResult(row);
    setCachedUserFullContext(sessionToken, response);

    return response;
  } catch (error) {
    console.error('[AUTH UTILS] Get user full context error:', error);
    deleteCachedUserFullContext(sessionToken);
    return { isValid: false, reason: 'ERROR' };
  } finally {
    client.release();
  }
}
