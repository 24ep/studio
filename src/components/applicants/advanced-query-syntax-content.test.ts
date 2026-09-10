import { describe, expect, it } from 'vitest';

import {
  ADVANCED_QUERY_EXAMPLE_CATEGORIES,
  ADVANCED_QUERY_FIELDS,
  ADVANCED_QUERY_SHORTCUT_GROUPS,
  ADVANCED_QUERY_SPECIAL_VALUES,
  ADVANCED_QUERY_STATUS_VALUES,
  ADVANCED_QUERY_TIPS,
  getAdvancedQueryExampleCopyKey,
} from './advanced-query-syntax-content';

describe('advanced query syntax content', () => {
  it('keeps syntax guide sections populated with stable identifiers', () => {
    expect(ADVANCED_QUERY_FIELDS.map(item => item.field)).toContain('minAppliedJobFitScore');
    expect(ADVANCED_QUERY_STATUS_VALUES).toContain('Interview Scheduled');
    expect(ADVANCED_QUERY_SPECIAL_VALUES.map(item => item.value)).toEqual([
      'unassigned',
      'select-all',
      'not-applied',
    ]);
    expect(ADVANCED_QUERY_SHORTCUT_GROUPS.flat().map(item => item.label)).toContain('Open Syntax Guide');
    expect(ADVANCED_QUERY_TIPS.length).toBeGreaterThan(0);
  });

  it('provides example categories with copyable queries', () => {
    expect(ADVANCED_QUERY_EXAMPLE_CATEGORIES.length).toBeGreaterThan(0);
    expect(ADVANCED_QUERY_EXAMPLE_CATEGORIES.every(category => category.examples.length > 0)).toBe(true);
    expect(ADVANCED_QUERY_EXAMPLE_CATEGORIES[0].examples[0]).toMatchObject({
      query: 'minAppliedJobFitScore:80',
      description: 'High-priority Applicants (>=80% fit score)',
    });
    expect(getAdvancedQueryExampleCopyKey('Quick Commands', 0)).toBe('Quick Commands-0');
  });
});
