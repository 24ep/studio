import { describe, expect, it, vi } from 'vitest';
import {
  TWO_FACTOR_VERIFY_CODE_LENGTH,
  canSubmitTwoFactorVerifyCode,
  getTwoFactorOtpSlotIndexes,
  getTwoFactorVerifyCancelLabel,
  getTwoFactorVerifyPrompt,
  getTwoFactorVerifyResendButtonLabel,
  isTwoFactorVerifyEmailMethod,
  isTwoFactorVerifySubmitDisabled,
  shouldRunTwoFactorVerifyResend,
} from './two-factor-verify-utils';

describe('two-factor-verify-utils', () => {
  it('treats missing or email method as email verification', () => {
    expect(isTwoFactorVerifyEmailMethod()).toBe(true);
    expect(isTwoFactorVerifyEmailMethod('email')).toBe(true);
    expect(isTwoFactorVerifyEmailMethod('totp')).toBe(false);
  });

  it('checks whether a verification code can be submitted', () => {
    expect(canSubmitTwoFactorVerifyCode('12345')).toBe(false);
    expect(canSubmitTwoFactorVerifyCode('123456')).toBe(true);
    expect(canSubmitTwoFactorVerifyCode('1234567')).toBe(true);
  });

  it('derives submit disabled state from loading and code length', () => {
    expect(isTwoFactorVerifySubmitDisabled(true, '123456')).toBe(true);
    expect(isTwoFactorVerifySubmitDisabled(false, '12345')).toBe(true);
    expect(isTwoFactorVerifySubmitDisabled(undefined, '123456')).toBe(false);
  });

  it('allows resend only when a handler exists and no resend is in flight', () => {
    expect(shouldRunTwoFactorVerifyResend(vi.fn(), false)).toBe(true);
    expect(shouldRunTwoFactorVerifyResend(vi.fn(), true)).toBe(false);
    expect(shouldRunTwoFactorVerifyResend(undefined, false)).toBe(false);
  });

  it('builds labels for cancel and resend actions', () => {
    expect(getTwoFactorVerifyCancelLabel(true)).toBe('Use a different email');
    expect(getTwoFactorVerifyCancelLabel(false)).toBe('Cancel');
    expect(getTwoFactorVerifyResendButtonLabel(true)).toBe('Sending...');
    expect(getTwoFactorVerifyResendButtonLabel(false)).toBe('Resend code');
  });

  it('builds email and authenticator prompt parts', () => {
    expect(getTwoFactorVerifyPrompt({ email: 'user@example.com', method: 'email' })).toEqual({
      lead: "We've sent a code to ",
      emphasis: 'user@example.com',
      tail: '. Enter it below to continue.',
    });
    expect(getTwoFactorVerifyPrompt({ email: 'user@example.com', method: 'totp' })).toEqual({
      lead: 'Enter the 6-digit code from your ',
      emphasis: 'authenticator app',
      tail: ' to continue.',
    });
  });

  it('builds stable OTP slot indexes from the verify code length', () => {
    expect(getTwoFactorOtpSlotIndexes()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(getTwoFactorOtpSlotIndexes()).toHaveLength(TWO_FACTOR_VERIFY_CODE_LENGTH);
  });
});
