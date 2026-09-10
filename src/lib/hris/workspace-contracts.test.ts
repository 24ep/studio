import { describe, expect, it } from 'vitest';

import { normalizeHrisTaskFilter, taskDecisionRequiresComment } from './workspace-contracts';

describe('HRIS workspace contracts', () => {
  it('normalizes task filters and caps pagination', () => {
    expect(normalizeHrisTaskFilter({ query: '  payroll  ', domains: [' leave ', ''], pageSize: 500 })).toMatchObject({
      query: 'payroll',
      domains: ['leave'],
      pageSize: 100,
    });
  });

  it('requires context for negative or workflow-reversing decisions', () => {
    expect(taskDecisionRequiresComment('reject')).toBe(true);
    expect(taskDecisionRequiresComment('request_changes')).toBe(true);
    expect(taskDecisionRequiresComment('approve')).toBe(false);
  });
});
