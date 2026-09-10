import { describe, expect, it } from 'vitest';
import {
  buildApplicantInsertParams,
  buildAutomationApplicantData,
  buildJobMatchInsertParams,
  getAutomationJobMatchAuditCount,
  getSafeAutomationJobMatches,
} from './create-applicant-with-matches-utils';
import type { AutomationApplicantInput, AutomationJobMatchInput } from './create-applicant-with-matches-schema';

const applicant: AutomationApplicantInput = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  fitScore: 0,
};

const jobMatches: AutomationJobMatchInput[] = [
  { jobId: 'position-1', jobTitle: 'Engineer', fitScore: 0.91, matchReasons: ['React'] },
  { jobTitle: 'Missing id', fitScore: 0.5 },
];

describe('create-applicant-with-matches-utils', () => {
  it('filters job matches and applies them to applicant parsed data safely', () => {
    const safeMatches = getSafeAutomationJobMatches(jobMatches, true);
    const prepared = buildAutomationApplicantData(applicant, safeMatches);

    expect(safeMatches).toHaveLength(1);
    expect(prepared.positionId).toBe('position-1');
    expect(prepared.parsedData?.job_matches).toEqual(safeMatches);
    expect(getAutomationJobMatchAuditCount(true, safeMatches)).toBe(1);
    expect(getAutomationJobMatchAuditCount(false, safeMatches)).toBe(0);
  });

  it('removes stale parsed job matches when no safe matches remain', () => {
    const prepared = buildAutomationApplicantData({
      ...applicant,
      parsedData: { job_matches: [{ jobId: 'old' }], source: 'queue' },
    }, []);

    expect(prepared.parsedData).toEqual({ source: 'queue' });
  });

  it('builds insert params for applicants and job matches', () => {
    const prepared = buildAutomationApplicantData(applicant, getSafeAutomationJobMatches(jobMatches, true));
    const params = buildApplicantInsertParams({
      applicantData: prepared,
      applicantId: 'applicant-1',
      resolvedStatusId: 'stage-1',
      now: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(params[0]).toBe('applicant-1');
    expect(params[4]).toBe('stage-1');
    expect(params[8]).toContain('job_matches');
    expect(params[11]).toEqual(new Date('2026-01-01T00:00:00.000Z'));

    expect(buildJobMatchInsertParams({
      applicantId: 'applicant-1',
      match: getSafeAutomationJobMatches(jobMatches, true)[0],
      matchId: 'match-1',
    })).toEqual([
      'match-1',
      'applicant-1',
      'position-1',
      'Engineer',
      0.91,
      ['React'],
      undefined,
    ]);
  });
});
