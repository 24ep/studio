import { describe, expect, it } from 'vitest';
import {
  updateCustomFieldFilters,
  updateExperienceMaximum,
  updateExperienceMinimum,
} from './applicant-mobile-filters-panel-utils';

describe('applicant-mobile-filters-panel-utils', () => {
  it('updates experience range bounds from input text', () => {
    expect(updateExperienceMinimum([2, 8], '4')).toEqual([4, 8]);
    expect(updateExperienceMaximum([2, 8], '12')).toEqual([2, 12]);
    expect(updateExperienceMinimum([2, 8], '')).toEqual([0, 8]);
    expect(updateExperienceMaximum([2, 8], 'oops')).toEqual([2, 0]);
  });

  it('updates one custom field filter while preserving the rest', () => {
    expect(updateCustomFieldFilters(
      { department: 'sales' },
      'region',
      ['apac']
    )).toEqual({
      department: 'sales',
      region: ['apac'],
    });
  });
});
