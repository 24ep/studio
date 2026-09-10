import type { LockoutQueryClient, LoginFailureType } from '@/lib/auth-lockout-types';

export async function resetFailedLoginAttemptFields(client: LockoutQueryClient, userId: string): Promise<void> {
  await client.query(`
    UPDATE "User"
    SET "failed_login_attempts" = 0,
        "last_failed_login" = NULL,
        "locked_until" = NULL,
        "updatedAt" = NOW()
    WHERE id = $1
  `, [userId]);
}

export async function insertAccountLockedActivityLog(
  client: LockoutQueryClient,
  userId: string,
  failedAttempts: number,
  failureType: LoginFailureType,
  now: Date,
): Promise<void> {
  await client.query(`
    INSERT INTO "UserActivityLog" (id, user_id, action, details, created_at)
    VALUES (gen_random_uuid(), $1, 'ACCOUNT_LOCKED', $2, $3)
  `, [userId, JSON.stringify({
    reason: 'Too many failed login attempts',
    failedAttempts,
    failureType,
    lockType: 'PERMANENT_UNTIL_ADMIN_UNLOCK',
  }), now]);
}

export async function insertFailedLoginActivityLog(
  client: LockoutQueryClient,
  userId: string,
  failedAttempts: number,
  remainingAttempts: number,
  now: Date,
): Promise<void> {
  await client.query(`
    INSERT INTO "UserActivityLog" (id, user_id, action, details, created_at)
    VALUES (gen_random_uuid(), $1, 'SIGN_IN_FAILED', $2, $3)
  `, [userId, JSON.stringify({
    reason: 'Invalid password',
    failedAttempts,
    remainingAttempts,
  }), now]);
}

export async function insertAccountUnlockedActivityLog(
  client: LockoutQueryClient,
  userId: string,
  performedBy: string,
): Promise<void> {
  await client.query(`
    INSERT INTO "UserActivityLog" (id, user_id, action, details, performed_by, created_at)
    VALUES (gen_random_uuid(), $1, 'ACCOUNT_UNLOCKED', $2, $3, NOW())
  `, [userId, JSON.stringify({ reason: 'Manual unlock by administrator' }), performedBy]);
}
