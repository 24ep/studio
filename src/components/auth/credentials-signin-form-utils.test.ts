import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_DISABLED_MESSAGE,
  ACCOUNT_LOCKED_MESSAGE,
  GENERIC_LOGIN_FAILED_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  PASSWORD_SETUP_REQUIRED_MESSAGE,
  buildCredentialsButtonStyle,
  getCredentialsResultErrorMessage,
  getCredentialsSearchErrorMessage,
  getSafeCredentialsRedirectUrl,
  getTwoFactorRequiredMethod,
  isNextRedirectError,
} from './credentials-signin-form-utils';

describe('credentials-signin-form-utils', () => {
  it('normalizes search parameter auth errors for display', () => {
    expect(getCredentialsSearchErrorMessage(null)).toBeNull();
    expect(getCredentialsSearchErrorMessage('CredentialsSignin')).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(getCredentialsSearchErrorMessage('invalid%20code')).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(getCredentialsSearchErrorMessage('PASSWORD_SETUP_REQUIRED')).toBe(PASSWORD_SETUP_REQUIRED_MESSAGE);
    expect(getCredentialsSearchErrorMessage('Account%20not%20configured')).toBe('Account not configured');
  });

  it('parses supported two-factor required signals', () => {
    expect(getTwoFactorRequiredMethod('TWO_FACTOR_REQUIRED:totp')).toBe('totp');
    expect(getTwoFactorRequiredMethod('TWO_FACTOR_REQUIRED:email')).toBe('email');
    expect(getTwoFactorRequiredMethod('TWO_FACTOR_REQUIRED:sms')).toBeNull();
    expect(getTwoFactorRequiredMethod('CredentialsSignin')).toBeNull();
  });

  it('maps credential result errors to user-safe messages', () => {
    expect(getCredentialsResultErrorMessage('ACCOUNT_DISABLED')).toBe(ACCOUNT_DISABLED_MESSAGE);
    expect(getCredentialsResultErrorMessage('This account is locked')).toBe(ACCOUNT_LOCKED_MESSAGE);
    expect(getCredentialsResultErrorMessage('PASSWORD_SETUP_REQUIRED')).toBe(PASSWORD_SETUP_REQUIRED_MESSAGE);
    expect(getCredentialsResultErrorMessage('CallbackRouteError')).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(getCredentialsResultErrorMessage('invalid code')).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(getCredentialsResultErrorMessage('unknown-service-error')).toBe(GENERIC_LOGIN_FAILED_MESSAGE);
  });

  it('hardens credential callback redirects', () => {
    expect(getSafeCredentialsRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeCredentialsRedirectUrl('/auth/signin')).toBe('/');
    expect(getSafeCredentialsRedirectUrl('/auth/signin?callbackUrl=/dashboard')).toBe('/');
    expect(getSafeCredentialsRedirectUrl('https://example.test/dashboard')).toBe('/');
    expect(getSafeCredentialsRedirectUrl('//example.test/dashboard')).toBe('/');
    expect(getSafeCredentialsRedirectUrl(null)).toBe('/');
  });

  it('detects Next redirect errors without throwing on unknown values', () => {
    expect(isNextRedirectError({ digest: 'NEXT_REDIRECT;replace;/dashboard' })).toBe(true);
    expect(isNextRedirectError({ digest: 'OTHER' })).toBe(false);
    expect(isNextRedirectError(new Error('no digest'))).toBe(false);
    expect(isNextRedirectError(null)).toBe(false);
  });

  it('builds credentials submit button style from active branding colors', () => {
    expect(buildCredentialsButtonStyle({
      activeBgStart: '1 2% 3%',
      activeBgEnd: '4 5% 6%',
      activeFontColor: '#fff',
    })).toEqual({
      background: 'linear-gradient(90deg, hsl(1 2% 3%), hsl(4 5% 6%))',
      color: '#fff',
      border: 'none',
      boxShadow: '0 8px 32px 0 hsla(1 2% 3%, 0.35), 0 4px 16px 0 hsla(1 2% 3%, 0.25)',
    });

    expect(buildCredentialsButtonStyle({})).toEqual({
      background: undefined,
      color: undefined,
      border: 'none',
      boxShadow: undefined,
    });
  });
});
