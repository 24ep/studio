import { describe, expect, it } from 'vitest';
import type { Position } from '@/lib/types';
import {
  getJobMatchDisplayTitle,
  getJobMatchFitScore,
  getJobMatchPosition,
  getJobMatchReasons,
} from './job-match-tab-utils';

describe('job-match-tab-utils', () => {
  it('normalizes finite numeric fit scores only', () => {
    expect(getJobMatchFitScore({ fitScore: 82 })).toBe(82);
    expect(getJobMatchFitScore({ fitScore: Number.NaN })).toBeNull();
    expect(getJobMatchFitScore({ fitScore: '82' })).toBeNull();
    expect(getJobMatchFitScore({})).toBeNull();
  });

  it('keeps only non-empty string match reasons', () => {
    expect(getJobMatchReasons({ matchReasons: [' Strong fit ', '', 42, 'Relevant background'] })).toEqual([
      ' Strong fit ',
      'Relevant background',
    ]);
    expect(getJobMatchReasons({ matchReasons: null })).toEqual([]);
  });

  it('finds the related position by id before falling back to title', () => {
    const positions = [
      { id: 'position-1', title: 'Engineer' },
      { id: 'position-2', title: 'Designer' },
    ] as Position[];

    expect(getJobMatchPosition(positions, { jobId: 'position-2', jobTitle: 'Engineer' })?.id).toBe('position-2');
    expect(getJobMatchPosition(positions, { jobTitle: 'Engineer' })?.id).toBe('position-1');
    expect(getJobMatchPosition(positions, { jobTitle: 'Unknown' })).toBeNull();
  });

  it('resolves display titles with sensible fallbacks', () => {
    expect(getJobMatchDisplayTitle({ title: 'Position title' } as Position, { jobTitle: 'Match title' })).toBe('Position title');
    expect(getJobMatchDisplayTitle(null, { jobTitle: 'Match title' })).toBe('Match title');
    expect(getJobMatchDisplayTitle(null, {})).toBe('Unknown Position');
  });
});
