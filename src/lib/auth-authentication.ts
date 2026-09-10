import { maskEmail, resetFailedLoginAttempts } from "@/lib/auth-lockout-utils";
import {
  getAuthUserAccessFailure,
  validatePasswordIfProvided,
} from "@/lib/auth-authentication-access";
import {
  fetchAuthUserByEmail,
  fetchAuthUserPermissions,
  logSuccessfulLogin,
  type AuthUserRow,
} from "@/lib/auth-authentication-data";
import { handleTwoFactorRequirement } from "@/lib/auth-authentication-two-factor";
import type { AuthQueryClient } from "@/lib/auth-query-types";
import {
  buildAuthSuccessResult,
  userNotFoundFailure,
  type AuthResult,
} from "@/lib/auth-utils-results";

export async function authenticateUserWithClient(
  client: AuthQueryClient,
  email: string,
  password?: string,
  twoFactorCode?: string,
): Promise<AuthResult> {
  const user = await fetchAuthUserByEmail(client, email);

  if (!user) {
    console.warn(`[AUTH] User not found for email: ${maskEmail(email)}`);
    return userNotFoundFailure();
  }

  const accessFailure = await getAuthUserAccessFailure(client, user, email, password);
  if (accessFailure) {
    return accessFailure;
  }

  const passwordFailure = await validatePasswordIfProvided(client, user, email, password);
  if (passwordFailure) {
    return passwordFailure;
  }

  const twoFactorFailure = await handleTwoFactorRequirement(client, user, email, password, twoFactorCode);
  if (twoFactorFailure) {
    return twoFactorFailure;
  }

  return completeSuccessfulAuthentication(client, user);
}

async function completeSuccessfulAuthentication(
  client: AuthQueryClient,
  user: AuthUserRow,
): Promise<AuthResult> {
  await resetFailedLoginAttempts(client, user.id);
  await logSuccessfulLogin(client, user.id);
  const permissions = await fetchAuthUserPermissions(client, user.id);
  return buildAuthSuccessResult(user, permissions);
}
