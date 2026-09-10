import { describe, expect, it } from 'vitest';

import {
  displayApplicantTableDate,
  getApplicantTableRowStateClass,
  getRowHeightStyle,
  getRowPaddingClass,
  isApplicantTableDetailIdValid,
} from './applicant-table-row-utils';
import type { Applicant } from '@/lib/types';

function applicant(overrides: Partial<Applicant>): Applicant {
  return {
    id: 'applicant-1',
    name: 'Applicant',
    email: 'applicant@example.test',
    ...overrides,
  } as Applicant;
}

describe('applicant table row utilities', () => {
  it('maps row height settings to styles and padding classes', () => {
    expect(getRowHeightStyle('compact')).toEqual({ height: '48px', minHeight: '48px' });
    expect(getRowHeightStyle('normal')).toEqual({ height: '64px', minHeight: '64px' });
    expect(getRowHeightStyle('comfortable')).toEqual({ height: '80px', minHeight: '80px' });

    expect(getRowPaddingClass('compact')).toBe('[&>td]:py-2');
    expect(getRowPaddingClass('normal')).toBe('[&>td]:py-4');
    expect(getRowPaddingClass('comfortable')).toBe('[&>td]:py-6');
  });

  it('formats table dates defensively', () => {
    expect(displayApplicantTableDate(null)).toBe('N/A');
    expect(displayApplicantTableDate('not-a-date')).toBe('Invalid Date');
    expect(displayApplicantTableDate('2026-01-01T10:30:00.000Z', 0)).toBe('Jan 1, 2026 17:30');
  });

  it('validates detail ids and row state classes', () => {
    expect(isApplicantTableDetailIdValid('1b7cc964-4a01-4b7f-84ad-a5a9c9e3a21e')).toBe(true);
    expect(isApplicantTableDetailIdValid('not-a-uuid')).toBe(false);

    expect(getApplicantTableRowStateClass(applicant({ isBlacklisted: true }))).toContain('border-l-red-500');
    expect(getApplicantTableRowStateClass(applicant({ isPinned: true }))).toContain('border-l-amber-500');
    expect(getApplicantTableRowStateClass(applicant({ isRead: false }))).toContain('border-l-blue-500');
    expect(getApplicantTableRowStateClass(applicant({ isRead: true }))).toBe('');
  });
});
