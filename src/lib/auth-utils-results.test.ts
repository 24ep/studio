import { describe, expect, it } from 'vitest';

import {
  accountLockedFailure,
  authFailure,
  buildAuthSuccessResult,
  buildSessionUser,
  getAllowedAuthenticationMethods,
  getErrorDiagnostics,
  getFailedVerificationAttemptType,
  getTwoFactorMethod,
  hasBackupCode,
  invalidCredentialsFailure,
  isBasicPasswordLoginAllowed,
  isPasswordlessLogin,
  isTwoFactorRequired,
  passwordSetupRequiredFailure,
  removeBackupCode,
  systemAuthFailure,
  userNotFoundFailure,
} from './auth-utils-results';

describe('auth result utilities', () => {
  it('builds standard failure responses', () => {
    expect(userNotFoundFailure()).toEqual({
      success: false,
      error: 'USER_NOT_FOUND',
      message: 'Invalid email or password',
    });

    expect(accountLockedFailure('locked')).toEqual({
      success: false,
      error: 'ACCOUNT_LOCKED',
      message: 'locked',
    });

    expect(invalidCredentialsFailure('bad', { remainingAttempts: 2 })).toEqual({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'bad',
      remainingAttempts: 2,
    });

    expect(systemAuthFailure()).toEqual({
      success: false,
      error: 'SYSTEM_ERROR',
      message: 'An error occurred during authentication. Please try again.',
    });

    expect(passwordSetupRequiredFailure()).toEqual({
      success: false,
      error: 'PASSWORD_SETUP_REQUIRED',
      message: 'Set up your password using the secure link sent to your employee email before signing in.',
    });

    expect(authFailure('TWO_FACTOR_REQUIRED', 'code', { twoFactorMethod: 'email' })).toEqual({
      success: false,
      error: 'TWO_FACTOR_REQUIRED',
      message: 'code',
      twoFactorMethod: 'email',
    });
  });

  it('normalizes login methods and passwordless checks', () => {
    expect(getAllowedAuthenticationMethods(undefined)).toEqual(['basic']);
    expect(getAllowedAuthenticationMethods(['sso'])).toEqual(['sso']);

    expect(isBasicPasswordLoginAllowed('secret', ['basic'])).toBe(true);
    expect(isBasicPasswordLoginAllowed('secret', ['sso'])).toBe(false);
    expect(isBasicPasswordLoginAllowed(undefined, ['sso'])).toBe(true);

    expect(isPasswordlessLogin(undefined)).toBe(true);
    expect(isPasswordlessLogin('')).toBe(true);
    expect(isPasswordlessLogin('secret')).toBe(false);
  });

  it('decides when two-factor verification is required', () => {
    expect(isTwoFactorRequired(undefined, false, false)).toBe(true);
    expect(isTwoFactorRequired('secret', true, false)).toBe(true);
    expect(isTwoFactorRequired('secret', false, true)).toBe(true);
    expect(isTwoFactorRequired('secret', false, false)).toBe(false);

    expect(getTwoFactorMethod('totp')).toBe('totp');
    expect(getTwoFactorMethod('email')).toBe('email');
    expect(getTwoFactorMethod('unexpected')).toBe('email');
    expect(getFailedVerificationAttemptType(undefined)).toBe('passwordless');
    expect(getFailedVerificationAttemptType('secret')).toBe('2fa');
  });

  it('detects and removes backup codes without mutating source arrays', () => {
    const backupCodes = ['one', 'two', 'two'];

    expect(hasBackupCode(backupCodes, 'two')).toBe(true);
    expect(hasBackupCode(null, 'two')).toBe(false);
    expect(removeBackupCode(backupCodes, 'two')).toEqual(['one']);
    expect(backupCodes).toEqual(['one', 'two', 'two']);
    expect(removeBackupCode(null, 'two')).toEqual([]);
  });

  it('builds successful auth and session user payloads', () => {
    expect(buildAuthSuccessResult({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      role: 'admin',
      image: null,
      avatarUrl: 'avatar.png',
      personal_color: '#123456',
    }, ['dashboard.view'])).toEqual({
      success: true,
      user: {
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
        role: 'admin',
        image: null,
        avatarUrl: 'avatar.png',
        personalColor: '#123456',
        modulePermissions: ['dashboard.view'],
      },
    });

    expect(buildSessionUser({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      role: 'admin',
      image: 'image.png',
      avatarUrl: null,
      personal_color: null,
      is_active: true,
      two_factor_enabled: false,
      two_factor_method: null,
    })).toEqual({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      role: 'admin',
      image: 'image.png',
      avatarUrl: 'image.png',
      personalColor: null,
      isActive: true,
      twoFactorEnabled: false,
      twoFactorMethod: null,
    });
  });

  it('creates serializable error diagnostics', () => {
    const diagnostics = getErrorDiagnostics(new Error('database unavailable'), 'user-1');

    expect(diagnostics.error).toBe('database unavailable');
    expect(diagnostics.userId).toBe('user-1');
    expect(diagnostics.timestamp).toEqual(expect.any(String));
    expect(diagnostics.stack).toEqual(expect.any(String));
  });
});
