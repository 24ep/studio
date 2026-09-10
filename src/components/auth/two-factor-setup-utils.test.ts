import { describe, expect, it } from 'vitest';
import {
  getTwoFactorSetupButtonClassName,
  getTwoFactorSetupErrorMessage,
  getTwoFactorSetupNextStep,
  getTwoFactorVerifyBackStep,
  getTwoFactorVerifyDescription,
  isTwoFactorVerificationCodeComplete,
  normalizeTwoFactorBackupCodes,
  sanitizeTwoFactorVerificationCode,
} from './two-factor-setup-utils';

describe('two-factor-setup-utils', () => {
  it('sanitizes verification codes to six digits', () => {
    expect(sanitizeTwoFactorVerificationCode('12a 34-5678')).toBe('123456');
    expect(sanitizeTwoFactorVerificationCode('abc')).toBe('');
  });

  it('checks whether a verification code is complete', () => {
    expect(isTwoFactorVerificationCodeComplete('12345')).toBe(false);
    expect(isTwoFactorVerificationCodeComplete('123456')).toBe(true);
    expect(isTwoFactorVerificationCodeComplete('1234567')).toBe(false);
  });

  it('derives setup and back steps from the selected method', () => {
    expect(getTwoFactorSetupNextStep('totp')).toBe('setup');
    expect(getTwoFactorSetupNextStep('email')).toBe('verify');
    expect(getTwoFactorVerifyBackStep('totp')).toBe('setup');
    expect(getTwoFactorVerifyBackStep('email')).toBe('method');
  });

  it('builds verify descriptions for each method', () => {
    expect(getTwoFactorVerifyDescription('totp')).toBe(
      'Enter the 6-digit code from your authenticator app to confirm setup.'
    );
    expect(getTwoFactorVerifyDescription('email')).toBe(
      'Enter the 6-digit code from your email to confirm setup.'
    );
  });

  it('normalizes backup codes from API payloads', () => {
    expect(normalizeTwoFactorBackupCodes(['one', 2, 'three'])).toEqual(['one', 'three']);
    expect(normalizeTwoFactorBackupCodes(null)).toEqual([]);
  });

  it('extracts setup error messages with fallback text', () => {
    expect(getTwoFactorSetupErrorMessage(new Error('Bad code'), 'Fallback')).toBe('Bad code');
    expect(getTwoFactorSetupErrorMessage('plain string', 'Fallback')).toBe('Fallback');
  });

  it('keeps the setup button full width only when no cancel action exists', () => {
    expect(getTwoFactorSetupButtonClassName(true)).toBe('');
    expect(getTwoFactorSetupButtonClassName(false)).toBe('w-full');
  });
});
