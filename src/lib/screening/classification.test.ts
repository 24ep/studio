import { describe, expect, it } from 'vitest';
import { buildScreeningQueries } from './sources';
import { classifyScreeningText, scoreIdentityMatch } from './classification';
import type { ScreeningIdentity } from './types';

const identity: ScreeningIdentity = {
  name: 'Somchai Jaidee', aliases: [], employers: ['Example Company'], jobTitle: 'Sales Manager',
  location: 'Bangkok', education: ['Example University'], country: 'Thailand',
};

describe('digital footprint screening rules', () => {
  it('builds bounded Thai, English, and public social discovery queries', () => {
    const queries = buildScreeningQueries(identity, 5);
    expect(queries).toHaveLength(5);
    expect(queries.some(query => query.includes('ร้องเรียน'))).toBe(true);
    expect(queries.some(query => query.includes('site:linkedin.com/in'))).toBe(true);
  });

  it('categorizes job-relevant adverse-media terms without AI', () => {
    expect(classifyScreeningText('A regulator filed a fraud complaint')).toBe('fraud');
    expect(classifyScreeningText('รายงานการคุกคามในที่ทำงาน')).toBe('harassment');
    expect(classifyScreeningText('Ordinary professional biography')).toBe('irrelevant');
  });

  it('keeps a name-only result below the identity threshold', () => {
    const match = scoreIdentityMatch(identity, { sourceType:'brave', url:'https://example.test', title:'Somchai Jaidee mentioned in a report' });
    expect(match.signals).toEqual(['name']);
    expect(match.confidence).toBeLessThan(0.8);
  });

  it('corroborates identity from multiple job-related signals', () => {
    const match = scoreIdentityMatch(identity, { sourceType:'brave', url:'https://example.test', title:'Somchai Jaidee, Sales Manager at Example Company in Bangkok' });
    expect(match.signals).toEqual(expect.arrayContaining(['name','employer','location','job_title']));
    expect(match.confidence).toBeGreaterThanOrEqual(0.8);
  });
});
