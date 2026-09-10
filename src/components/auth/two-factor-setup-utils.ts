export type TwoFactorSetupMethod = 'totp' | 'email';
export type TwoFactorSetupStep = 'method' | 'setup' | 'verify' | 'success';

export const TWO_FACTOR_CODE_LENGTH = 6;

export function sanitizeTwoFactorVerificationCode(value: string) {
  return value.replace(/\D/g, '').slice(0, TWO_FACTOR_CODE_LENGTH);
}

export function isTwoFactorVerificationCodeComplete(code: string) {
  return code.length === TWO_FACTOR_CODE_LENGTH;
}

export function getTwoFactorSetupNextStep(method: TwoFactorSetupMethod): TwoFactorSetupStep {
  return method === 'totp' ? 'setup' : 'verify';
}

export function getTwoFactorVerifyBackStep(method: TwoFactorSetupMethod): TwoFactorSetupStep {
  return method === 'totp' ? 'setup' : 'method';
}

export function getTwoFactorVerifyDescription(method: TwoFactorSetupMethod) {
  return `Enter the 6-digit code from your ${method === 'totp' ? 'authenticator app' : 'email'} to confirm setup.`;
}

export function normalizeTwoFactorBackupCodes(value: unknown) {
  return Array.isArray(value) ? value.filter((code): code is string => typeof code === 'string') : [];
}

export function getTwoFactorSetupErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function getTwoFactorSetupButtonClassName(hasCancelAction: boolean) {
  return hasCancelAction ? '' : 'w-full';
}
