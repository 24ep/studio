import type { CSSProperties } from 'react';
export { isNextRedirectError } from '../../lib/next-redirect-error';

export type TwoFactorMethod = 'totp' | 'email';

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email, password, or verification code. Please try again.';
export const ACCOUNT_DISABLED_MESSAGE = 'This account has been disabled. Please contact an administrator.';
export const ACCOUNT_LOCKED_MESSAGE = 'Account has been locked due to multiple failed login attempts. Please contact an administrator.';
export const PASSWORD_SETUP_REQUIRED_MESSAGE = 'Set up your password using the secure link sent to your employee email before signing in.';
export const GENERIC_LOGIN_FAILED_MESSAGE = 'Login failed. Please try again.';
export const UNEXPECTED_LOGIN_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

const TWO_FACTOR_REQUIRED_PATTERN = /^TWO_FACTOR_REQUIRED:(totp|email)$/;

export function getCredentialsSearchErrorMessage(rawError: string | null) {
  if (!rawError) {
    return null;
  }

  const lowerError = rawError.toLowerCase();

  if (rawError === 'PASSWORD_SETUP_REQUIRED' || lowerError.includes('password setup')) {
    return PASSWORD_SETUP_REQUIRED_MESSAGE;
  }

  if (rawError === 'CredentialsSignin' || lowerError.includes('invalid') || lowerError.includes('code')) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  return decodeURIComponent(rawError);
}

export function getTwoFactorRequiredMethod(error: string): TwoFactorMethod | null {
  const match = error.match(TWO_FACTOR_REQUIRED_PATTERN);
  return match ? match[1] as TwoFactorMethod : null;
}

export function getCredentialsResultErrorMessage(error: string) {
  const lowerError = error.toLowerCase();

  if (lowerError.includes('disabled') || error === 'ACCOUNT_DISABLED') {
    return ACCOUNT_DISABLED_MESSAGE;
  }

  if (
    lowerError.includes('locked') ||
    error === 'ACCOUNT_LOCKED' ||
    lowerError.includes('account is locked') ||
    lowerError.includes('account has been locked') ||
    lowerError.includes('blocked')
  ) {
    return ACCOUNT_LOCKED_MESSAGE;
  }

  if (error === 'PASSWORD_SETUP_REQUIRED' || lowerError.includes('password setup')) {
    return PASSWORD_SETUP_REQUIRED_MESSAGE;
  }

  if (
    error === 'CredentialsSignin' ||
    error === 'Configuration' ||
    error === 'CallbackRouteError' ||
    lowerError.includes('invalid') ||
    lowerError.includes('code')
  ) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  return GENERIC_LOGIN_FAILED_MESSAGE;
}

export function getSafeCredentialsRedirectUrl(rawRedirectUrl: string | null) {
  const redirectUrl = rawRedirectUrl?.startsWith('/') && !rawRedirectUrl.startsWith('//')
    ? rawRedirectUrl
    : '/';

  if (redirectUrl === '/auth/signin' || redirectUrl.startsWith('/auth/signin?')) {
    return '/';
  }

  return redirectUrl;
}

export function buildCredentialsButtonStyle({
  activeBgStart,
  activeBgEnd,
  activeFontColor,
}: {
  activeBgStart?: string;
  activeBgEnd?: string;
  activeFontColor?: string;
}): CSSProperties {
  return {
    background: activeBgStart && activeBgEnd ? `linear-gradient(90deg, hsl(${activeBgStart}), hsl(${activeBgEnd}))` : undefined,
    color: activeFontColor || undefined,
    border: 'none',
    boxShadow: activeBgStart ? `0 8px 32px 0 hsla(${activeBgStart}, 0.35), 0 4px 16px 0 hsla(${activeBgStart}, 0.25)` : undefined,
  };
}
