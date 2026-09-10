import { getPool } from './db';
import {
  buildValidSessionResult,
  getSessionInvalidResult,
} from './auth-session-management-utils';
import type {
  UserSessionValidationResult,
  UserSessionValidationRow,
} from './auth-session-management-types';

/**
 * Validates if a session token is still active and not expired.
 * Returns the session info if valid, null if invalid.
 */
export async function validateUserSession(sessionToken: string): Promise<UserSessionValidationResult> {
  const client = await getPool().connect();
  try {
    const result = await client.query<UserSessionValidationRow>(`
      SELECT id, user_id, is_active, expires_at
      FROM "UserSession"
      WHERE session_token = $1
    `, [sessionToken]);

    if (result.rows.length === 0) {
      return { isValid: false, reason: 'NOT_FOUND' };
    }

    const session = result.rows[0];
    const invalidResult = getSessionInvalidResult(session);
    if (invalidResult) {
      return invalidResult;
    }

    await client.query(`
      UPDATE "UserSession"
      SET last_activity_at = NOW()
      WHERE id = $1
    `, [session.id]);

    return buildValidSessionResult(session);
  } catch (error) {
    console.error('[AUTH UTILS] Validate session error:', error);
    return { isValid: false, reason: 'NOT_FOUND' };
  } finally {
    client.release();
  }
}
