import { describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({
  CredentialsSignin: class CredentialsSignin extends Error {
    code = 'credentials';
  },
}));

import { AccountDisabledError, AccountLockedError, TwoFactorRequiredError } from './auth-errors';

describe('auth credential errors', () => {
  it('sets stable error codes for sign-in handling', () => {
    expect(new TwoFactorRequiredError('email').code).toBe('TWO_FACTOR_REQUIRED:email');
    expect(new AccountDisabledError().code).toBe('ACCOUNT_DISABLED');
    expect(new AccountLockedError().code).toBe('ACCOUNT_LOCKED');
  });
});
