import { describe, expect, it } from 'vitest';
import type { Applicant } from '@/lib/types';
import {
  getApplicantAiSearchErrorMessage,
  getApplicantAiSearchSuccessMessage,
  getApplicantDataListFromPayload,
  getMissingAiMatchedApplicantIds,
  getTrimmedApplicantAiSearchQuery,
  mergeUniqueApplicants,
  normalizeApplicantAiSearchResult,
} from './applicant-ai-search-utils';

const applicantA = { id: 'applicant-a' } as unknown as Applicant;
const applicantB = { id: 'applicant-b' } as unknown as Applicant;

describe('applicant-ai-search-utils', () => {
  it('normalizes queries and AI search API payloads', () => {
    expect(getTrimmedApplicantAiSearchQuery('  senior react  ')).toBe('senior react');
    expect(normalizeApplicantAiSearchResult({
      matchedApplicantIds: ['applicant-a', 3, 'applicant-b'],
      aiReasoning: 'Strong skills match',
      recordCount: 2,
    })).toEqual({
      matchedApplicantIds: ['applicant-a', 'applicant-b'],
      aiReasoning: 'Strong skills match',
      recordCount: 2,
    });
    expect(normalizeApplicantAiSearchResult(null)).toEqual({
      matchedApplicantIds: [],
      aiReasoning: 'AI search complete.',
      recordCount: 0,
    });
  });

  it('builds specific API error messages', () => {
    expect(getApplicantAiSearchErrorMessage(403, {})).toContain('permission');
    expect(getApplicantAiSearchErrorMessage(503, {})).toContain('temporarily unavailable');
    expect(getApplicantAiSearchErrorMessage(500, { details: { reason: 'bad gateway' } })).toBe('{"reason":"bad gateway"}');
    expect(getApplicantAiSearchErrorMessage(400, { error: 'Invalid query' })).toBe('Invalid query');
  });

  it('detects missing matches and merges applicants without duplicates', () => {
    expect(getMissingAiMatchedApplicantIds([applicantA], ['applicant-a', 'applicant-b'])).toEqual(['applicant-b']);
    expect(mergeUniqueApplicants([applicantA], [applicantA, applicantB])).toEqual([applicantA, applicantB]);
  });

  it('extracts applicant lists and reports success counts', () => {
    expect(getApplicantDataListFromPayload({ data: [applicantA, { missing: 'id' }, applicantB] })).toEqual([
      applicantA,
      applicantB,
    ]);
    expect(getApplicantDataListFromPayload({ data: 'bad' })).toBeNull();
    expect(getApplicantAiSearchSuccessMessage({
      matchedApplicantIds: ['applicant-a', 'applicant-b'],
      aiReasoning: 'Done',
      recordCount: 0,
    })).toBe('Found 2 potential match(es).');
  });
});
