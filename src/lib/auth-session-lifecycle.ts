import { getPool } from './db';
import { clearUserFullContextCache } from './auth-session-context-cache';
import { describeDevice, isDeviceChange } from './auth-device-detection';
import type { CreateUserSessionOptions, CreateUserSessionResult } from './auth-session-management-types';

/**
 * Creates a new session for a user and invalidates all previous sessions.
 * This enforces single-device login.
 */
export async function createUserSession(
  userId: string,
  sessionToken: string,
  options: CreateUserSessionOptions
): Promise<CreateUserSessionResult> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const previousSessionResult = await client.query<{ device_info: string | null }>(`
      SELECT device_info
      FROM "UserSession"
      WHERE "user_id" = $1 AND "is_active" = true AND "expires_at" > NOW()
      ORDER BY "created_at" DESC
      LIMIT 1
    `, [userId]);
    const previousDeviceInfo = previousSessionResult.rows[0]?.device_info ?? null;
    const deviceChanged = isDeviceChange(previousDeviceInfo, options.deviceInfo);

    const invalidateResult = await client.query(`
      UPDATE "UserSession"
      SET "is_active" = false
      WHERE "user_id" = $1 AND "is_active" = true
    `, [userId]);

    const invalidatedCount = invalidateResult.rowCount || 0;

    if (invalidatedCount > 0) {
      console.log(`[SESSION] Invalidated ${invalidatedCount} existing session(s) for user: ${userId}`);

      await client.query(`
        INSERT INTO "UserActivityLog" (id, user_id, action, details, created_at)
        VALUES (gen_random_uuid(), $1, 'SESSION_INVALIDATED', $2, NOW())
      `, [userId, JSON.stringify({
        reason: deviceChanged ? 'New login from another device' : 'New login replaced the active session',
        invalidatedCount,
        deviceChanged,
        previousDevice: describeDevice(previousDeviceInfo),
        currentDevice: describeDevice(options.deviceInfo),
      })]);
    }

    const sessionResult = await client.query(`
      INSERT INTO "UserSession" (id, user_id, session_token, device_info, ip_address, user_agent, is_active, created_at, expires_at, last_activity_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), $6, NOW())
      RETURNING id
    `, [userId, sessionToken, options.deviceInfo || null, options.ipAddress || null, options.userAgent || null, options.expiresAt]);

    const sessionId = sessionResult.rows[0].id;

    await client.query('COMMIT');

    console.log(`[SESSION] Created new session for user: ${userId}, sessionId: ${sessionId}`);

    return { sessionId, invalidatedCount, deviceChanged, previousDeviceInfo };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[AUTH UTILS] Create session error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Invalidates all sessions for a user (e.g., on password change or admin action)
 */
export async function invalidateUserSessions(userId: string, performedBy?: string): Promise<number> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      UPDATE "UserSession"
      SET "is_active" = false
      WHERE "user_id" = $1 AND "is_active" = true
    `, [userId]);

    const invalidatedCount = result.rowCount || 0;

    if (invalidatedCount > 0) {
      await client.query(`
        INSERT INTO "UserActivityLog" (id, user_id, action, details, performed_by, created_at)
        VALUES (gen_random_uuid(), $1, 'ALL_SESSIONS_INVALIDATED', $2, $3, NOW())
      `, [userId, JSON.stringify({
        reason: 'Manual invalidation',
        invalidatedCount,
      }), performedBy || null]);
    }

    console.log(`[SESSION] Invalidated ${invalidatedCount} session(s) for user: ${userId}`);
    return invalidatedCount;
  } catch (error) {
    console.error('[AUTH UTILS] Invalidate sessions error:', error);
    return 0;
  } finally {
    client.release();
  }
}

/**
 * Invalidates a specific session by token (e.g., on logout)
 */
export async function invalidateSession(sessionToken: string): Promise<boolean> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      UPDATE "UserSession"
      SET "is_active" = false
      WHERE "session_token" = $1 AND "is_active" = true
      RETURNING user_id
    `, [sessionToken]);

    if (result.rows.length > 0) {
      const userId = result.rows[0].user_id;

      await client.query(`
        INSERT INTO "UserActivityLog" (id, user_id, action, details, created_at)
        VALUES (gen_random_uuid(), $1, 'SIGN_OUT', $2, NOW())
      `, [userId, JSON.stringify({ method: 'session_invalidation' })]);

      clearUserFullContextCache(sessionToken);
      console.log(`[SESSION] Session invalidated for user: ${userId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[AUTH UTILS] Invalidate session error:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Gets active session count for a user
 */
export async function getActiveSessionCount(userId: string): Promise<number> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM "UserSession"
      WHERE "user_id" = $1 AND "is_active" = true AND "expires_at" > NOW()
    `, [userId]);

    return parseInt(result.rows[0]?.count || '0', 10);
  } catch (error) {
    console.error('[AUTH UTILS] Get active session count error:', error);
    return 0;
  } finally {
    client.release();
  }
}
