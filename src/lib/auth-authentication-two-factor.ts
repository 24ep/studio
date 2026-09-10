import { maskEmail, recordFailedLoginAttempt } from "@/lib/auth-lockout-utils";
import type { AuthUserRow } from "@/lib/auth-authentication-data";
import type { AuthQueryClient } from "@/lib/auth-query-types";
import {
  accountLockedFailure,
  authFailure,
  getFailedVerificationAttemptType,
  getTwoFactorMethod,
  hasBackupCode,
  invalidCredentialsFailure,
  isPasswordlessLogin,
  isTwoFactorRequired,
  removeBackupCode,
  type AuthResult,
} from "@/lib/auth-utils-results";
import { getSystemSetting } from "@/lib/systemSettings";
import { generateEmailOtp, sendEmailOtp, verifyTotpCode } from "@/lib/twoFactorAuth";

export async function handleTwoFactorRequirement(
  client: AuthQueryClient,
  user: AuthUserRow,
  email: string,
  password?: string,
  twoFactorCode?: string,
): Promise<AuthResult | null> {
  const globalTwoFactorSetting = await getSystemSetting("globalTwoFactorEnabled");
  const isGlobalTwoFactorEnabled = globalTwoFactorSetting === "true";
  const isPasswordless = isPasswordlessLogin(password);

  if (!isTwoFactorRequired(password, isGlobalTwoFactorEnabled, user.two_factor_enabled)) {
    return null;
  }

  if (twoFactorCode) {
    return verifyTwoFactorCode(client, user, email, password, twoFactorCode);
  }

  const method = getTwoFactorMethod(user.two_factor_method);
  if (method === "email") {
    const otp = generateEmailOtp();
    await client.query('UPDATE "User" SET "two_factor_secret" = $1 WHERE id = $2', [otp, user.id]);
    await sendEmailOtp(user.email, otp, user.name);
    console.log(`[AUTH] Sent OTP email to ${maskEmail(email)}`);
  }

  return authFailure(
    "TWO_FACTOR_REQUIRED",
    isPasswordless ? "Verification code required" : "Two-factor authentication required",
    { twoFactorMethod: method },
  );
}

async function verifyTwoFactorCode(
  client: AuthQueryClient,
  user: AuthUserRow,
  email: string,
  password: string | undefined,
  twoFactorCode: string,
): Promise<AuthResult | null> {
  if (hasBackupCode(user.two_factor_backup_codes, twoFactorCode)) {
    const newBackupCodes = removeBackupCode(user.two_factor_backup_codes, twoFactorCode);
    await client.query('UPDATE "User" SET "two_factor_backup_codes" = $1 WHERE id = $2', [newBackupCodes, user.id]);
    console.log(`[AUTH] Used backup code for user: ${maskEmail(email)}`);
    return null;
  }

  const method = getTwoFactorMethod(user.two_factor_method);
  const isTwoFactorValid = method === "totp"
    ? verifyTotpCode(twoFactorCode, user.two_factor_secret || "")
    : twoFactorCode === user.two_factor_secret;

  if (isTwoFactorValid && method === "email") {
    await client.query('UPDATE "User" SET "two_factor_secret" = NULL WHERE id = $1', [user.id]);
  }

  if (isTwoFactorValid) {
    return null;
  }

  console.warn(`[AUTH] Invalid 2FA/OTP code for email: ${maskEmail(email)}`);
  const failResult = await recordFailedLoginAttempt(
    client,
    user.id,
    email,
    getFailedVerificationAttemptType(password),
  );

  if (failResult.locked) {
    return accountLockedFailure("Account has been locked due to too many failed login attempts. Please contact an administrator to unlock your account.");
  }

  return invalidCredentialsFailure(
    `Invalid verification code. ${failResult.remainingAttempts} attempt(s) remaining before account lockout.`,
    { twoFactorMethod: getTwoFactorMethod(user.two_factor_method) },
  );
}
