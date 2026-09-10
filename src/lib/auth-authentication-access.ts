import bcrypt from "bcryptjs";

import {
  checkAccountLockout,
  maskEmail,
  recordFailedLoginAttempt,
} from "@/lib/auth-lockout-utils";
import type { AuthUserRow } from "@/lib/auth-authentication-data";
import type { AuthQueryClient } from "@/lib/auth-query-types";
import {
  accountLockedFailure,
  authFailure,
  getAllowedAuthenticationMethods,
  invalidCredentialsFailure,
  isBasicPasswordLoginAllowed,
  passwordSetupRequiredFailure,
  type AuthResult,
} from "@/lib/auth-utils-results";

export async function getAuthUserAccessFailure(
  client: AuthQueryClient,
  user: AuthUserRow,
  email: string,
  password?: string,
): Promise<AuthResult | null> {
  const lockStatus = await checkAccountLockout(client, user.id);
  if (lockStatus.locked) {
    console.warn(`[AUTH] Account is locked for email: ${maskEmail(email)}`);
    return accountLockedFailure();
  }

  if (!user.is_active) {
    console.warn(`[AUTH] User account is disabled for email: ${maskEmail(email)}`);
    return authFailure("ACCOUNT_DISABLED", "This account has been disabled. Please contact an administrator.");
  }

  if (user.role === "Employee" && user.force_password_change) {
    return passwordSetupRequiredFailure();
  }

  const allowedMethods = getAllowedAuthenticationMethods(user.authentication_methods);
  if (!isBasicPasswordLoginAllowed(password, allowedMethods)) {
    console.warn(`[AUTH] Basic auth attempted but not allowed for user: ${maskEmail(email)}`);
    return invalidCredentialsFailure("Password login is not enabled for this account.");
  }

  return null;
}

export async function validatePasswordIfProvided(
  client: AuthQueryClient,
  user: AuthUserRow,
  email: string,
  password?: string,
): Promise<AuthResult | null> {
  if (!password) {
    console.log(`[AUTH] Passwordless login attempt for: ${maskEmail(email)}`);
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password || "");
  if (isValid) {
    return null;
  }

  console.warn(`[AUTH] Invalid password for email: ${maskEmail(email)}`);
  const failResult = await recordFailedLoginAttempt(client, user.id, email, "password");

  if (failResult.locked) {
    return accountLockedFailure("Account has been locked due to too many failed login attempts. Please contact an administrator to unlock your account.");
  }

  return invalidCredentialsFailure(
    `Invalid email or password. ${failResult.remainingAttempts} attempt(s) remaining before account lockout.`,
    { remainingAttempts: failResult.remainingAttempts },
  );
}
