import { describe, expect, it } from 'vitest';
import {
  getSingleRowApplicantCountLabel,
  getSingleRowApplicantInitial,
  shouldShowSingleRowScrollHint,
} from './applicant-single-row-view-utils';

describe('applicant-single-row-view-utils', () => {
  it('derives avatar initials with the default applicant fallback', () => {
    expect(getSingleRowApplicantInitial('Ada Lovelace')).toBe('A');
    expect(getSingleRowApplicantInitial('')).toBe('C');
    expect(getSingleRowApplicantInitial(null)).toBe('C');
  });

  it('formats count labels and scroll hints', () => {
    expect(getSingleRowApplicantCountLabel(1)).toBe('1 applicant');
    expect(getSingleRowApplicantCountLabel(4)).toBe('4 applicants');
    expect(shouldShowSingleRowScrollHint(3)).toBe(false);
    expect(shouldShowSingleRowScrollHint(4)).toBe(true);
  });
});
