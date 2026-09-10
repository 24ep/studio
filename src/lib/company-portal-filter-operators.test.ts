import { describe, expect, it } from 'vitest';

import {
  getCompanyPortalFilterOperators,
  normalizeCompanyPortalFilterOperator,
} from './company-portal-filter-operators';

describe('company portal filter operators', () => {
  it('offers text matching only for text-like fields', () => {
    expect(getCompanyPortalFilterOperators('text').map(option => option.value)).toContain('contains');
    expect(getCompanyPortalFilterOperators('number').map(option => option.value)).not.toContain('contains');
    expect(getCompanyPortalFilterOperators('boolean').map(option => option.value)).not.toContain('contains');
  });

  it('offers ordered comparisons only for numbers and dates', () => {
    expect(getCompanyPortalFilterOperators('number').map(option => option.value)).toContain('greater_than');
    expect(getCompanyPortalFilterOperators('date').map(option => option.value)).toContain('less_than');
    expect(getCompanyPortalFilterOperators('text').map(option => option.value)).not.toContain('greater_than');
    expect(getCompanyPortalFilterOperators('boolean').map(option => option.value)).not.toContain('less_than');
  });

  it('normalizes an operator that is invalid for the newly selected field type', () => {
    expect(normalizeCompanyPortalFilterOperator('number', 'contains')).toBe('equals');
    expect(normalizeCompanyPortalFilterOperator('date', 'greater_than')).toBe('greater_than');
  });
});
