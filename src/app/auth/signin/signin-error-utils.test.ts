import { describe, expect, it } from 'vitest';

import { getSignInErrorMessage } from './signin-error-utils';

describe('getSignInErrorMessage', () => {
  it('returns an empty message when no error is present', () => {
    expect(getSignInErrorMessage(null)).toBe('');
  });

  it('routes legacy credential and configuration failures back to Account', () => {
    const message = 'Sign-in could not be completed. Continue with Outborn Account or contact support.';
    expect(getSignInErrorMessage('CredentialsSignin')).toBe(message);
    expect(getSignInErrorMessage('Configuration')).toBe(message);
  });

  it('maps session and Account OAuth errors to friendly messages', () => {
    expect(getSignInErrorMessage('SessionExpired')).toBe('Your session has expired. Please sign in again.');
    expect(getSignInErrorMessage('OAuthCallback')).toBe('There was an error signing in with Outborn Account. Please try again or contact support.');
  });

  it('decodes unknown error messages', () => {
    expect(getSignInErrorMessage('Custom%20failure')).toBe('Custom failure');
  });
});
