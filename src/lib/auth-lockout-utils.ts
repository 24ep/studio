import { getPool } from '@/lib/db';
import {
  insertAccountLockedActivityLog,
  insertAccountUnlockedActivityLog,
  insertFailedLoginActivityLog,
  resetFailedLoginAttemptFields,
} from '@/lib/auth-lockout-activity';
import { sendLockoutAlerts } from '@/lib/auth-lockout-alerts';
import { maskEmail } from '@/lib/auth-lockout-formatting';
import type {
  AccountLockoutRow,
  AccountLockoutStatusRow,
  FailedLoginAttemptsRow,
  LockoutQueryClient,
  LoginFailureType,
} from '@/lib/auth-lockout-types';

export const LOCKOUT_CONFIG = {
  MAX_FAILED_ATTEMPTS: 3,
};

export { maskEmail };

export async function recordFailedLoginAttempt(
  client: LockoutQueryClient,
  userId: string,
  email: string,
  failureType: LoginFailureType = 'password'
): Promise<{ locked: boolean; remainingAttempts: number }> {
  const now = new Date();

  const currentResult = await client.query(`
    SELECT "failed_login_attempts"
    FROM "User"
    WHERE id = $1
  `, [userId]);

  const current = currentResult.rows[0] as FailedLoginAttemptsRow | undefined;
  const failedAttempts = (current?.failed_login_attempts || 0) + 1;

  if (failedAttempts >= LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS) {
    await client.query(`
      UPDATE "User"
      SET "failed_login_attempts" = $1,
          "last_failed_login" = $2,
          "is_active" = false,
          "updatedAt" = $2
      WHERE id = $3
    `, [failedAttempts, now, userId]);

    console.warn(`[AUTH] Account PERMANENTLY locked for email: ${maskEmail(email)} - requires admin unlock`);
    await insertAccountLockedActivityLog(client, userId, failedAttempts, failureType, now);

    try {
      await sendLockoutAlerts({ now, userId, email, failedAttempts });
    } catch (alertError) {
      console.error('[AUTH] Error triggering lockout alerts:', alertError);
    }

    return { locked: true, remainingAttempts: 0 };
  }

  await client.query(`
    UPDATE "User"
    SET "failed_login_attempts" = $1,
        "last_failed_login" = $2,
        "updatedAt" = $2
    WHERE id = $3
  `, [failedAttempts, now, userId]);

  const remainingAttempts = LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS - failedAttempts;
  await insertFailedLoginActivityLog(client, userId, failedAttempts, remainingAttempts, now);

  return {
    locked: false,
    remainingAttempts
  };
}

export async function resetFailedLoginAttempts(client: LockoutQueryClient, userId: string): Promise<void> {
  await resetFailedLoginAttemptFields(client, userId);
}

export async function checkAccountLockout(client: LockoutQueryClient, userId: string): Promise<{ locked: boolean }> {
  const result = await client.query(`
    SELECT "is_active", "failed_login_attempts"
    FROM "User"
    WHERE id = $1
  `, [userId]);

  const user = result.rows[0] as AccountLockoutRow | undefined;

  const failedAttempts = user?.failed_login_attempts ?? 0;
  if (!user?.is_active && failedAttempts >= LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS) {
    return { locked: true };
  }

  return { locked: false };
}

export async function unlockUserAccount(userId: string, performedBy: string): Promise<boolean> {
  const client = await getPool().connect();
  try {
    await resetFailedLoginAttemptFields(client, userId);
    await insertAccountUnlockedActivityLog(client, userId, performedBy);

    console.log(`[AUTH] Account unlocked for user: ${userId} by: ${performedBy}`);
    return true;
  } catch (error) {
    console.error('[AUTH UTILS] Unlock account error:', error);
    return false;
  } finally {
    client.release();
  }
}

export async function getAccountLockoutStatus(userId: string): Promise<{
  failedAttempts: number;
  isLocked: boolean;
  lockedUntil: Date | null;
  lastFailedLogin: Date | null;
}> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      SELECT "failed_login_attempts", "locked_until", "last_failed_login"
      FROM "User"
      WHERE id = $1
    `, [userId]);

    const user = result.rows[0] as AccountLockoutStatusRow | undefined;
    if (!user) {
      return {
        failedAttempts: 0,
        isLocked: false,
        lockedUntil: null,
        lastFailedLogin: null
      };
    }

    const lockedUntil = user.locked_until ? new Date(user.locked_until) : null;
    const isLocked = lockedUntil ? lockedUntil > new Date() : false;

    return {
      failedAttempts: user.failed_login_attempts || 0,
      isLocked,
      lockedUntil: isLocked ? lockedUntil : null,
      lastFailedLogin: user.last_failed_login ? new Date(user.last_failed_login) : null
    };
  } catch (error) {
    console.error('[AUTH UTILS] Get lockout status error:', error);
    return {
      failedAttempts: 0,
      isLocked: false,
      lockedUntil: null,
      lastFailedLogin: null
    };
  } finally {
    client.release();
  }
}
