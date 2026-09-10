import { describe, expect, it } from 'vitest';

import { isNextRedirectError } from './next-redirect-error';

describe('next-redirect-error', () => {
  it('detects Next redirect errors by digest prefix', () => {
    expect(isNextRedirectError({ digest: 'NEXT_REDIRECT;replace;/dashboard' })).toBe(true);
    expect(isNextRedirectError({ digest: 'NEXT_REDIRECT' })).toBe(true);
  });

  it('returns false for non-redirect and malformed errors', () => {
    expect(isNextRedirectError({ digest: 'NEXT_NOT_FOUND' })).toBe(false);
    expect(isNextRedirectError({ digest: 123 })).toBe(false);
    expect(isNextRedirectError(new Error('no digest'))).toBe(false);
    expect(isNextRedirectError(null)).toBe(false);
  });
});
