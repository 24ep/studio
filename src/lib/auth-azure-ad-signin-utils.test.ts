import { describe, expect, it } from 'vitest';

import {
  getAzureAdAllowedMethods,
  getAzureAdProfileObjectId,
  isUsableAzureAdAccount,
  isUsableAzureAdProfile,
} from './auth-azure-ad-signin-utils';

describe('auth azure ad signin utilities', () => {
  it('identifies usable Azure AD accounts', () => {
    expect(isUsableAzureAdAccount({ provider: 'azure-ad', providerAccountId: 'oid-1' })).toBe(true);
    expect(isUsableAzureAdAccount({ provider: 'github', providerAccountId: 'oid-1' })).toBe(false);
    expect(isUsableAzureAdAccount({ provider: 'azure-ad' })).toBe(false);
  });

  it('identifies usable Azure AD profiles', () => {
    expect(isUsableAzureAdProfile({ email: 'user@example.com' })).toBe(true);
    expect(isUsableAzureAdProfile({ email: '   ' })).toBe(false);
    expect(isUsableAzureAdProfile({ name: 'No Email' })).toBe(false);
  });

  it('normalizes allowed authentication methods', () => {
    expect(getAzureAdAllowedMethods(['basic', 'azure_ad', 123])).toEqual(['basic', 'azure_ad']);
    expect(getAzureAdAllowedMethods(null)).toEqual(['basic']);
  });

  it('chooses the Azure AD object id fallback order', () => {
    expect(getAzureAdProfileObjectId({ email: 'user@example.com', oid: 'oid', sub: 'sub' })).toBe('oid');
    expect(getAzureAdProfileObjectId({ email: 'user@example.com', sub: 'sub' })).toBe('sub');
    expect(getAzureAdProfileObjectId({ email: 'user@example.com' })).toBe('user@example.com');
  });
});
