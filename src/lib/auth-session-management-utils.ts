import { expandPermissionSet } from './permission-aliases';
import type { UserFullContextResult } from './auth-session-context-cache';
import type {
  UserFullContextRow,
  UserSessionValidationResult,
  UserSessionValidationRow,
} from './auth-session-management-types';

export const SESSION_ACTIVITY_UPDATE_INTERVAL_MS = 60000;

export function getSessionInvalidResult(
  session: Pick<UserSessionValidationRow, 'user_id' | 'is_active' | 'expires_at'>,
  now = new Date()
): UserSessionValidationResult | null {
  if (!session.is_active) {
    return { isValid: false, reason: 'INVALIDATED', userId: session.user_id };
  }

  const expiresAt = new Date(session.expires_at);
  if (expiresAt < now) {
    return { isValid: false, reason: 'EXPIRED', userId: session.user_id };
  }

  return null;
}

export function buildValidSessionResult(session: UserSessionValidationRow): UserSessionValidationResult {
  return {
    isValid: true,
    userId: session.user_id,
    sessionId: session.id,
    expiresAt: new Date(session.expires_at),
    reason: 'VALID',
  };
}

export function shouldUpdateSessionActivity(
  lastActivityAt: Date | string | null | undefined,
  now = new Date()
) {
  if (!lastActivityAt) {
    return true;
  }

  const lastActivity = new Date(lastActivityAt);
  return now.getTime() - lastActivity.getTime() > SESSION_ACTIVITY_UPDATE_INTERVAL_MS;
}

export function getFullContextInvalidResult(
  row: Pick<UserFullContextRow, 'session_active' | 'expires_at' | 'user_id'>,
  now = new Date()
): UserFullContextResult | null {
  if (!row.session_active) {
    return { isValid: false, reason: 'INVALIDATED', userId: row.user_id };
  }

  if (new Date(row.expires_at) < now) {
    return { isValid: false, reason: 'EXPIRED', userId: row.user_id };
  }

  return null;
}

export function buildUserFullContextResult(row: UserFullContextRow): UserFullContextResult {
  return {
    isValid: true,
    reason: 'VALID',
    userId: row.user_id,
    user: {
      id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      image: row.image,
      avatarUrl: row.avatarUrl || row.image || null,
      personalColor: row.personal_color || null,
      isActive: row.user_active,
      twoFactorEnabled: row.two_factor_enabled,
      twoFactorMethod: row.two_factor_method,
      modulePermissions: expandPermissionSet(row.permissions || []),
    },
  };
}
