import { describe, expect, it } from 'vitest';

import { resolveCompanyScope } from './company-scope';

const companyA = '00000000-0000-4000-8000-000000000001';
const companyB = '00000000-0000-4000-8000-000000000002';

describe('HRIS company scope', () => {
  it('injects a non-admin actor company when the request omits it', () => {
    expect(resolveCompanyScope(companyA, null)).toEqual({
      allowed: true,
      companyId: companyA,
    });
  });

  it('rejects cross-company requests for non-admin actors', () => {
    expect(resolveCompanyScope(companyA, companyB)).toEqual({
      allowed: false,
      companyId: companyA,
    });
  });

  it('allows global administrators to select or omit a company', () => {
    expect(resolveCompanyScope(null, companyB)).toEqual({
      allowed: true,
      companyId: companyB,
    });
    expect(resolveCompanyScope(null, null)).toEqual({
      allowed: true,
      companyId: null,
    });
  });
});
