import { describe, expect, it } from 'vitest';

import type { Headcount } from '../../lib/types';
import {
  formatHeadcountRequestDateGroupLabel,
  getHeadcountApprovalDecision,
  getHeadcountActualStatus,
  getHeadcountTableColumnCount,
  groupHeadcountsByRequestDate,
} from './headcount-table-utils';

function makeHeadcount(overrides: Partial<Headcount>): Headcount {
  return {
    id: overrides.id || 'headcount',
    positionId: overrides.positionId || 'position-1',
    type: overrides.type || 'new',
    status: overrides.status || 'vacant',
    requestDate: overrides.requestDate ?? null,
    onboardingDate: overrides.onboardingDate ?? null,
    applicantId: overrides.applicantId ?? null,
    applicant: overrides.applicant,
    notes: overrides.notes ?? null,
    memoId: overrides.memoId ?? null,
    employeeId: overrides.employeeId ?? null,
    customFields: overrides.customFields ?? {},
    attachments: overrides.attachments ?? [],
    createdAt: overrides.createdAt || '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-01-01T00:00:00.000Z',
  };
}

describe('headcount table utilities', () => {
  it('counts base and custom field columns', () => {
    expect(getHeadcountTableColumnCount(0)).toBe(11);
    expect(getHeadcountTableColumnCount(3)).toBe(14);
  });

  it('treats filled rows without applicants as vacant', () => {
    expect(getHeadcountActualStatus(makeHeadcount({ status: 'filled', applicantId: 'applicant-1' }))).toBe('filled');
    expect(getHeadcountActualStatus(makeHeadcount({ status: 'filled', applicantId: null }))).toBe('vacant');
    expect(getHeadcountActualStatus(makeHeadcount({ status: 'vacant', applicantId: 'applicant-1' }))).toBe('vacant');
  });

  it('maps headcount request approval audit details', () => {
    expect(getHeadcountApprovalDecision(makeHeadcount({
      status: 'pending' as Headcount['status'],
      customFields: { requestSource: 'hiring_headcount_request' },
    }))).toMatchObject({
      state: 'pending',
      actorName: null,
    });

    expect(getHeadcountApprovalDecision(makeHeadcount({
      status: 'vacant',
      customFields: {
        requestSource: 'hiring_headcount_request',
        approvalAction: 'approve',
        approvalActionByName: 'Ada Lovelace',
        approvalActionAt: '2026-07-29T08:00:00.000Z',
      },
    }))).toEqual({
      state: 'approved',
      actorName: 'Ada Lovelace',
      decidedAt: '2026-07-29T08:00:00.000Z',
      rejectionReason: null,
    });

    expect(getHeadcountApprovalDecision(makeHeadcount({
      status: 'rejected' as Headcount['status'],
      customFields: {
        approvalAction: 'reject',
        approvalActionByName: 'Grace Hopper',
        rejectionReason: 'Budget is not available',
      },
    }))).toMatchObject({
      state: 'rejected',
      actorName: 'Grace Hopper',
      rejectionReason: 'Budget is not available',
    });

    expect(getHeadcountApprovalDecision(makeHeadcount({
      status: 'vacant',
      customFields: {},
    }))).toMatchObject({
      state: 'not_required',
    });
  });

  it('groups headcounts by request date newest-first with no-date last', () => {
    const grouped = groupHeadcountsByRequestDate([
      makeHeadcount({ id: 'old', requestDate: '2026-01-01T00:00:00.000Z' }),
      makeHeadcount({ id: 'none', requestDate: null }),
      makeHeadcount({ id: 'new', requestDate: '2026-01-03T00:00:00.000Z' }),
      makeHeadcount({ id: 'new-2', requestDate: '2026-01-03T12:00:00.000Z' }),
    ]);

    expect(grouped.map(([date, rows]) => [date, rows.map(row => row.id)])).toEqual([
      ['2026-01-03', ['new', 'new-2']],
      ['2026-01-01', ['old']],
      ['No Date', ['none']],
    ]);
  });

  it('formats request date group labels', () => {
    expect(formatHeadcountRequestDateGroupLabel('No Date')).toBe('Not Set');
    expect(formatHeadcountRequestDateGroupLabel('2026-01-03')).toBe('Jan 03, 2026');
  });
});
