import { describe, expect, it } from 'vitest';

import { DEFAULT_ORGANIZATION_PROFILE, parseOrganizationProfile } from './organization-profile';

describe('organization profile', () => {
  it('returns defaults for invalid serialized data', () => {
    expect(parseOrganizationProfile('not-json')).toEqual(DEFAULT_ORGANIZATION_PROFILE);
  });

  it('merges saved data with new profile fields', () => {
    expect(parseOrganizationProfile(JSON.stringify({
      legalName: 'Example Company Limited',
      customAttributes: [{ id: 'one', label: 'Branch code', type: 'text', value: 'BKK' }],
    }))).toMatchObject({
      legalName: 'Example Company Limited',
      currency: '',
      customAttributes: [{ id: 'one', label: 'Branch code', type: 'text', value: 'BKK' }],
    });
  });

  it('drops malformed custom attributes', () => {
    expect(parseOrganizationProfile(JSON.stringify({
      customAttributes: [{ label: 'Missing ID', type: 'text', value: '' }],
    })).customAttributes).toEqual([]);
  });
});
