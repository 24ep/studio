import { describe, expect, it } from 'vitest';
import {
  approvalRouteCatalogSchema,
  DEFAULT_HEADCOUNT_APPROVAL_ROUTES,
  parseHeadcountApprovalRoutes,
} from './headcount-approval-path-config';

describe('headcount approval path configuration', () => {
  it('uses defaults when no saved catalog exists', () => {
    expect(parseHeadcountApprovalRoutes(null)).toEqual(DEFAULT_HEADCOUNT_APPROVAL_ROUTES);
  });

  it('requires one default and one active route', () => {
    const result = approvalRouteCatalogSchema.safeParse([{ id: 'route', name: 'Route', description: '', isActive: false, isDefault: false, steps: [{ role: 'HR', title: 'Review' }] }]);
    expect(result.success).toBe(false);
  });

  it('accepts a valid custom route catalog', () => {
    const catalog = [{ id: 'regional', name: 'Regional', description: '', isActive: true, isDefault: true, steps: [{ role: 'Country lead', title: 'Country approval' }] }];
    expect(parseHeadcountApprovalRoutes(JSON.stringify(catalog))).toEqual(catalog);
  });
});
