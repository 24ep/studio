import { describe, expect, it } from 'vitest';
import type { Applicant, RecruitmentStage } from '@/lib/types';
import type { ApplicantSettings } from './applicant-settings-types';
import {
  buildApplicantTableStageNames,
  getApplicantTableColumnHeader,
  getApplicantTableColumnOrder,
  getApplicantTableNextSortState,
  getApplicantTableStageIds,
  getApplicantTableVisibleColumnCount,
  shouldOpenApplicantTableRowDetail,
  shouldShowApplicantTableColumn,
} from './applicant-table-column-utils';

const settings: ApplicantSettings = {
  showApplicantColumn: true,
  showAppliedJobColumn: true,
  showJobMatchesColumn: true,
  showFitScoreColumn: true,
  showRecruiterColumn: true,
  showSourceColumn: true,
  showStatusColumn: true,
  showAppliedDateColumn: true,
  showLastUpdateColumn: false,
  showCreatedDateColumn: false,
  columnOrder: ['applicant', 'createdAt', 'unknown-column'],
  showFilters: true,
  showHorizontalFitScoreFilters: true,
  fitScoreType: 'applied',
  fitScoreFilterMode: 'single',
  rowHeight: 'normal',
  showPinSection: false,
  pageSize: 20,
  sortColumn: 'applicationDate',
  sortDirection: 'desc',
  groupBy: 'none',
};

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: overrides.id ?? 'applicant-id',
    name: overrides.name ?? 'Applicant',
    email: overrides.email ?? 'applicant@example.com',
    parsedData: overrides.parsedData ?? null,
    positionId: overrides.positionId ?? null,
    fitScore: overrides.fitScore ?? 0,
    statusId: overrides.statusId ?? 'new',
    status: overrides.status ?? 'New',
    applicationDate: overrides.applicationDate ?? '2026-01-01T00:00:00.000Z',
    transitionHistory: overrides.transitionHistory ?? [],
    ...overrides,
  };
}

function makeStage(overrides: Partial<RecruitmentStage> = {}): RecruitmentStage {
  return {
    id: overrides.id ?? 'new',
    name: overrides.name ?? 'New',
    isSystem: overrides.isSystem ?? false,
    ...overrides,
  };
}

describe('applicant table column utilities', () => {
  it('filters unknown column ids while preserving supported aliases', () => {
    expect(getApplicantTableColumnOrder(settings)).toEqual(['applicant', 'createdAt']);
  });

  it('maps created date aliases to a consistent header', () => {
    expect(getApplicantTableColumnHeader('createdAt')).toEqual({
      label: 'Created Date',
      className: 'w-[120px]',
      sortKey: 'createdAt',
    });
    expect(getApplicantTableColumnHeader('createdDate')).toEqual({
      label: 'Created Date',
      className: 'w-[120px]',
      sortKey: 'createdAt',
    });
  });

  it('uses typed settings for visibility checks', () => {
    expect(shouldShowApplicantTableColumn(settings, 'createdAt')).toBe(false);
    expect(shouldShowApplicantTableColumn(settings, 'createdDate')).toBe(false);
    expect(shouldShowApplicantTableColumn(settings, 'jobMatches', false)).toBe(false);
    expect(shouldShowApplicantTableColumn(settings, 'applicant')).toBe(true);
  });

  it('counts visible columns including fixed and action columns', () => {
    expect(getApplicantTableVisibleColumnCount(settings)).toBe(12);
    expect(getApplicantTableVisibleColumnCount({
      ...settings,
      showLastUpdateColumn: true,
      showCreatedDateColumn: true,
    })).toBe(14);
  });

  it('cycles table sort state by column and direction', () => {
    expect(getApplicantTableNextSortState({
      column: 'name',
      currentSortColumn: null,
      currentSortDirection: null,
    })).toEqual({ column: 'name', direction: 'asc' });

    expect(getApplicantTableNextSortState({
      column: 'name',
      currentSortColumn: 'name',
      currentSortDirection: 'asc',
    })).toEqual({ column: 'name', direction: 'desc' });

    expect(getApplicantTableNextSortState({
      column: 'name',
      currentSortColumn: 'name',
      currentSortDirection: 'desc',
    })).toEqual({ column: null, direction: null });
  });

  it('decides whether a table row click should open applicant detail', () => {
    expect(shouldOpenApplicantTableRowDetail({
      defaultPrevented: false,
      isInteractiveTarget: false,
      isDialogTarget: false,
    })).toBe(true);
    expect(shouldOpenApplicantTableRowDetail({
      defaultPrevented: true,
      isInteractiveTarget: false,
      isDialogTarget: false,
    })).toBe(false);
    expect(shouldOpenApplicantTableRowDetail({
      defaultPrevented: false,
      isInteractiveTarget: true,
      isDialogTarget: false,
    })).toBe(false);
    expect(shouldOpenApplicantTableRowDetail({
      defaultPrevented: false,
      isInteractiveTarget: false,
      isDialogTarget: true,
    })).toBe(false);
  });

  it('derives applicant table stage ids and names', () => {
    expect(getApplicantTableStageIds([
      makeApplicant({ id: 'a', name: 'A', statusId: 'new' }),
      makeApplicant({ id: 'b', name: 'B', statusId: 'screening' }),
      makeApplicant({ id: 'c', name: 'C', statusId: 'new' }),
      makeApplicant({ id: 'd', name: 'D', statusId: '' }),
    ])).toEqual(['new', 'screening']);

    expect(buildApplicantTableStageNames([
      makeStage({ id: 'new', name: 'New' }),
      makeStage({ id: 'blank', name: '' }),
      makeStage({ id: '', name: 'Missing id' }),
    ])).toEqual({ new: 'New' });
  });
});
