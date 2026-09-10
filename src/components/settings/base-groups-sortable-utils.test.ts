import { describe, expect, it } from 'vitest';
import { getSingularBaseItemTitle } from './base-groups-sortable-utils';

describe('base-groups-sortable-utils', () => {
  it('removes a trailing plural s from item titles', () => {
    expect(getSingularBaseItemTitle('Skills')).toBe('Skill');
  });

  it('leaves already singular titles unchanged', () => {
    expect(getSingularBaseItemTitle('Category')).toBe('Category');
  });
});
