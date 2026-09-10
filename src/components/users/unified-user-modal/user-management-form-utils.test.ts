import { describe, expect, it } from 'vitest';

import { AUTHENTICATION_METHOD_OPTIONS, updateAuthenticationMethods } from './user-management-form-utils';

describe('user management form utilities', () => {
  it('adds and removes authentication methods without duplicates', () => {
    expect(updateAuthenticationMethods(undefined, 'basic', true)).toEqual(['basic']);
    expect(updateAuthenticationMethods(['basic'], 'basic', true)).toEqual(['basic']);
    expect(updateAuthenticationMethods(['basic', 'azure_ad'], 'basic', false)).toEqual(['azure_ad']);
  });

  it('keeps auth method options aligned with supported values', () => {
    expect(AUTHENTICATION_METHOD_OPTIONS.map((option) => option.value)).toEqual(['basic', 'azure_ad']);
  });
});
