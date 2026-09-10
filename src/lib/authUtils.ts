import { maskEmail } from "@/lib/auth-lockout-utils";
import { authenticateUserWithClient } from "@/lib/auth-authentication";
import { getPool } from "@/lib/db";
import { systemAuthFailure, type AuthResult } from "@/lib/auth-utils-results";

export {
  LOCKOUT_CONFIG,
  getAccountLockoutStatus,
  unlockUserAccount,
} from "@/lib/auth-lockout-utils";
export { clearUserFullContextCache } from "@/lib/auth-session-context-cache";
export {
  createUserSession,
  getActiveSessionCount,
  getUserFullContext,
  invalidateSession,
  invalidateUserSessions,
  validateUserSession,
} from "@/lib/auth-session-management";
export {
  getUserPermissions,
  getUserSessionData,
} from "@/lib/auth-session-query-utils";
export type { AuthResult } from "@/lib/auth-utils-results";

/**
 * Authenticates a user with email, password, and optional 2FA code.
 * Implements lockout tracking and uses a single database connection for the flow.
 */
export async function authenticateUser(
  email: string,
  password?: string,
  twoFactorCode?: string,
): Promise<AuthResult> {
  console.log("[AUTH UTILS] Authenticating user:", maskEmail(email));
  const client = await getPool().connect();

  try {
    return await authenticateUserWithClient(client, email, password, twoFactorCode);
  } catch (error) {
    console.error("[AUTH UTILS] Authentication error:", error);
    return systemAuthFailure();
  } finally {
    console.log("[AUTH UTILS] Releasing client for:", maskEmail(email));
    client.release();
  }
}
