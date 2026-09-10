export type TwoFactorVerifyMethod = 'totp' | 'email';

export const TWO_FACTOR_VERIFY_CODE_LENGTH = 6;
export const TWO_FACTOR_RESEND_SUCCESS_TIMEOUT_MS = 3000;
export const TWO_FACTOR_OTP_SLOT_CLASS_NAME = 'w-14 h-16 text-2xl font-bold shadow-sm bg-zinc-100/80 dark:bg-zinc-800/80';

export function isTwoFactorVerifyEmailMethod(method?: TwoFactorVerifyMethod) {
  return method === 'email' || !method;
}

export function canSubmitTwoFactorVerifyCode(code: string) {
  return code.length >= TWO_FACTOR_VERIFY_CODE_LENGTH;
}

export function isTwoFactorVerifySubmitDisabled(isLoading: boolean | undefined, code: string) {
  return !!isLoading || !canSubmitTwoFactorVerifyCode(code);
}

export function shouldRunTwoFactorVerifyResend(
  onResend: unknown,
  isResending: boolean
): onResend is () => Promise<void> {
  return typeof onResend === 'function' && !isResending;
}

export function getTwoFactorVerifyCancelLabel(isEmailMethod: boolean) {
  return isEmailMethod ? 'Use a different email' : 'Cancel';
}

export function getTwoFactorVerifyResendButtonLabel(isResending: boolean) {
  return isResending ? 'Sending...' : 'Resend code';
}

export function getTwoFactorVerifyPrompt({
  email,
  method,
}: {
  email: string;
  method?: TwoFactorVerifyMethod;
}) {
  if (isTwoFactorVerifyEmailMethod(method)) {
    return {
      lead: "We've sent a code to ",
      emphasis: email,
      tail: '. Enter it below to continue.',
    };
  }

  return {
    lead: 'Enter the 6-digit code from your ',
    emphasis: 'authenticator app',
    tail: ' to continue.',
  };
}

export function getTwoFactorOtpSlotIndexes() {
  return Array.from({ length: TWO_FACTOR_VERIFY_CODE_LENGTH }, (_, index) => index);
}
