import { describe, expect, it, vi } from 'vitest';

import type { Applicant, ApplicantFilterValues, ApplicantSource, JobMatch, Position, RecruitmentStage } from '@/lib/types';
import {
  buildInitialApplicantFiltersFromSearchParams,
  buildApplicantExportQuery,
  buildApplicantClearFiltersUrl,
  buildApplicantPageSettingsViewState,
  buildApplicantPageSizeSettings,
  buildApplicantSortSettings,
  buildApplicantStageNames,
  buildApplicantTableQuery,
  buildPinnedApplicantsQuery,
  buildEffectiveApplicantFilterData,
  buildApplicantPagePermissions,
  buildApplicantScoreCounts,
  buildApplicantTableFetchRequestId,
  buildApplicantTotalPages,
  clearApplicantHorizontalFitScoreFilters,
  countActiveApplicantFilters,
  countApplicantsByStage,
  fetchApplicantExportBlob,
  getApplicantAdvancedQueryParam,
  getApplicantAiSearchTotalUpdate,
  getApplicantExportImportFeatureEnabled,
  getApplicantHorizontalFitScoreFilterAction,
  getApplicantExportErrorMessage,
  getApplicantInitialFetchAction,
  getApplicantInitialLoadingState,
  getApplicantTablePaginationState,
  getNextApplicantTableSort,
  getClearedApplicantAiSearchState,
  getMissingApplicantPositionIds,
  getUniqueApplicantStageIds,
  groupApplicantsByEmailForTable,
  hasSignificantApplicantFilterChange,
  hasActiveApplicantFilterValues,
  hasApplicantHorizontalFitScoreSelections,
  hasDefinedApplicantFilterValues,
  hydrateApplicantsForDisplay,
  mergePositionsById,
  selectApplicantsToRender,
  selectDisplayedApplicantsForTable,
  selectApplicantsByIds,
  selectApplicantScoreCountsForDisplay,
  selectPaginatedApplicantsForDisplay,
  splitPinnedApplicantsForTable,
  shouldRefreshApplicantFitScoreCountsForFilterChange,
  shouldRefreshApplicantFitScoreCountsOnMount,
  shouldSkipApplicantTableFetch,
  shouldStartApplicantRealtimeRefresh,
  toggleAllApplicantTableSelection,
  toggleApplicantGradeSelection,
  toggleApplicantTableSelection,
} from './applicant-page-utils';

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: overrides.id ?? 'position-1',
    title: overrides.title ?? 'Designer',
    department: overrides.department ?? 'Product',
    isOpen: overrides.isOpen ?? true,
    ...overrides,
  };
}

function makeRecruitmentStage(overrides: Partial<RecruitmentStage> = {}): RecruitmentStage {
  return {
    id: overrides.id ?? 'stage-1',
    name: overrides.name ?? 'Applied',
    isSystem: overrides.isSystem ?? false,
    ...overrides,
  };
}

function makeApplicantSource(overrides: Partial<ApplicantSource> = {}): ApplicantSource {
  return {
    id: overrides.id ?? 'source-1',
    name: overrides.name ?? 'Referral',
    description: overrides.description ?? null,
    email: overrides.email ?? null,
    logo: overrides.logo ?? null,
    allowSubSource: overrides.allowSubSource ?? false,
    sortOrder: overrides.sortOrder ?? 0,
    isActive: overrides.isActive ?? true,
    ...overrides,
  };
}

function makeJobMatch(overrides: Partial<JobMatch> = {}): JobMatch {
  return {
    id: overrides.id ?? 'job-match-1',
    applicantId: overrides.applicantId ?? 'applicant-id',
    fitScore: overrides.fitScore ?? 0,
    ...overrides,
  };
}

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: overrides.id ?? 'applicant-id',
    name: overrides.name ?? 'Applicant',
    email: overrides.email ?? 'applicant@example.com',
    parsedData: overrides.parsedData ?? null,
    positionId: overrides.positionId ?? null,
    fitScore: overrides.fitScore ?? 0,
    statusId: overrides.statusId ?? 'applied',
    status: overrides.status ?? 'Applied',
    applicationDate: overrides.applicationDate ?? '2026-01-01T00:00:00.000Z',
    transitionHistory: overrides.transitionHistory ?? [],
    ...overrides,
  };
}

describe('applicant page utilities', () => {
  it('builds applicant page permissions from legacy and canonical permission ids', () => {
    expect(buildApplicantPagePermissions([
      'applicantS_EXPORT',
      'APPLICANTS_CREATE',
      'applicantS_EDIT_BASIC_OWN',
      'APPLICANTS_PIPELINE_STAGE_UPDATE_ALL',
      'applicantS_SOURCE_ASSIGN',
      'APPLICANTS_RECRUITER_ASSIGN',
    ])).toMatchObject({
      canExportApplicants: true,
      canCreateApplicants: true,
      canEditApplicants: true,
      canDeleteApplicants: false,
      canChangeStatus: true,
      canBulkChangeStatus: true,
      canViewDetailed: false,
      canAssignSource: true,
      canAssignRecruiter: true,
    });

    expect(buildApplicantPagePermissions(null)).toEqual({
      canExportApplicants: false,
      canCreateApplicants: false,
      canEditApplicants: false,
      canDeleteApplicants: false,
      canChangeStatus: false,
      canBulkChangeStatus: false,
      canViewDetailed: false,
      canAssignSource: false,
      canAssignRecruiter: false,
    });
  });

  it('resolves export/import feature settings from object or array API payloads', () => {
    expect(getApplicantExportImportFeatureEnabled({
      exportImportFeatureEnabled: 'false',
    })).toBe(false);
    expect(getApplicantExportImportFeatureEnabled({
      exportImportFeatureEnabled: true,
    })).toBe(true);
    expect(getApplicantExportImportFeatureEnabled({
      settings: [
        { key: 'theme', value: 'dark' },
        { key: 'exportImportFeatureEnabled', value: 'false' },
      ],
    })).toBe(false);
    expect(getApplicantExportImportFeatureEnabled({
      settings: [
        { key: 'exportImportFeatureEnabled', value: 'true' },
      ],
    })).toBe(true);
    expect(getApplicantExportImportFeatureEnabled(null)).toBe(true);
  });

  it('builds applicant table settings updates without dropping existing preferences', () => {
    const settings = {
      pageSize: 20,
      sortColumn: 'name',
      sortDirection: 'asc' as const,
      showPinned: true,
    };

    expect(buildApplicantPageSizeSettings(settings, 50)).toEqual({
      pageSize: 50,
      sortColumn: 'name',
      sortDirection: 'asc',
      showPinned: true,
    });
    expect(buildApplicantSortSettings(settings, 'applicationDate', 'desc')).toEqual({
      pageSize: 20,
      sortColumn: 'applicationDate',
      sortDirection: 'desc',
      showPinned: true,
    });
    expect(buildApplicantSortSettings(settings, null, undefined)).toEqual({
      pageSize: 20,
      sortColumn: 'applicationDate',
      sortDirection: 'desc',
      showPinned: true,
    });
    expect(buildApplicantSortSettings(settings, 'name', null)).toEqual({
      pageSize: 20,
      sortColumn: 'name',
      sortDirection: null,
      showPinned: true,
    });
  });

  it('builds applicant page settings view state with safe defaults', () => {
    expect(buildApplicantPageSettingsViewState(null, false)).toEqual({
      pageSize: 20,
      sortColumn: 'applicationDate',
      sortDirection: 'desc',
      showPinSection: false,
      groupBy: 'none',
    });

    expect(buildApplicantPageSettingsViewState({
      pageSize: 50,
      sortColumn: 'name',
      sortDirection: 'asc',
      showPinSection: true,
      groupBy: 'none',
    }, false)).toEqual({
      pageSize: 50,
      sortColumn: 'name',
      sortDirection: 'asc',
      showPinSection: true,
      groupBy: 'none',
    });

    expect(buildApplicantPageSettingsViewState({
      pageSize: 10,
      sortColumn: 'email',
      sortDirection: 'desc',
      showPinSection: true,
    }, true).showPinSection).toBe(false);
  });

  it('reads advanced applicant query from URL search params', () => {
    expect(getApplicantAdvancedQueryParam(new URLSearchParams({ query: 'senior designer' }))).toBe('senior designer');
    expect(getApplicantAdvancedQueryParam(new URLSearchParams({ status: 'new' }))).toBeUndefined();
    expect(getApplicantAdvancedQueryParam(new URLSearchParams({ query: '' }))).toBeUndefined();
  });

  it('builds total pages for regular and AI search result counts', () => {
    expect(buildApplicantTotalPages({
      isAiSearchActive: false,
      aiMatchedApplicantIds: ['ignored'],
      aiRecordCount: 100,
      total: 45,
      pageSize: 20,
    })).toBe(3);

    expect(buildApplicantTotalPages({
      isAiSearchActive: true,
      aiMatchedApplicantIds: ['a', 'b'],
      aiRecordCount: 41,
      total: 200,
      pageSize: 20,
    })).toBe(3);

    expect(buildApplicantTotalPages({
      isAiSearchActive: true,
      aiMatchedApplicantIds: [],
      aiRecordCount: 0,
      total: 0,
      pageSize: 0,
    })).toBe(1);
  });

  it('resolves applicant table sort transitions', () => {
    expect(getNextApplicantTableSort({
      column: null,
      direction: 'desc',
      currentSortColumn: 'name',
      currentSortDirection: 'asc',
    })).toEqual({
      column: 'applicationDate',
      direction: 'desc',
    });

    expect(getNextApplicantTableSort({
      column: 'name',
      currentSortColumn: 'name',
      currentSortDirection: 'asc',
    })).toEqual({
      column: 'name',
      direction: 'desc',
    });

    expect(getNextApplicantTableSort({
      column: 'name',
      currentSortColumn: 'name',
      currentSortDirection: 'desc',
    })).toEqual({
      column: 'name',
      direction: null,
    });

    expect(getNextApplicantTableSort({
      column: 'email',
      currentSortColumn: 'name',
      currentSortDirection: null,
    })).toEqual({
      column: 'email',
      direction: 'asc',
    });
  });

  it('toggles applicant table row selection safely', () => {
    expect(Array.from(toggleApplicantTableSelection(new Set(['a']), 'b'))).toEqual(['a', 'b']);
    expect(Array.from(toggleApplicantTableSelection(new Set(['a', 'b']), 'a'))).toEqual(['b']);

    expect(Array.from(toggleAllApplicantTableSelection(new Set(['a']), [
      { id: 'a' },
      { id: 'b' },
    ]))).toEqual(['a', 'b']);
    expect(Array.from(toggleAllApplicantTableSelection(new Set(['a', 'b']), [
      { id: 'a' },
      { id: 'b' },
    ]))).toEqual([]);
    expect(Array.from(toggleAllApplicantTableSelection(new Set(), null))).toEqual([]);
  });

  it('builds applicant table pagination labels and disabled states', () => {
    expect(getApplicantTablePaginationState({
      isAiSearchActive: false,
      aiMatchedApplicantIds: null,
      aiRecordCount: 0,
      total: 45,
      page: 2,
      pageSize: 20,
      totalPages: 3,
    })).toMatchObject({
      currentTotal: 45,
      hasMore: true,
      startItem: 21,
      endItem: 40,
      rangeLabel: 'Showing 21 to 40 of 45 applicants',
      pageLabel: 'Page 2 of 3',
      isPreviousPageDisabled: false,
      isNextPageDisabled: false,
    });

    expect(getApplicantTablePaginationState({
      isAiSearchActive: true,
      aiMatchedApplicantIds: ['a'],
      aiRecordCount: 1,
      total: 45,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })).toMatchObject({
      currentTotal: 1,
      hasMore: false,
      allItemsLabel: 'Showing all 1 AI-matched applicants',
      rangeLabel: 'Showing 1 to 1 of 1 AI-matched applicants',
      isPreviousPageDisabled: true,
      isNextPageDisabled: true,
    });

    expect(getApplicantTablePaginationState({
      isAiSearchActive: true,
      aiMatchedApplicantIds: [],
      aiRecordCount: 0,
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })).toMatchObject({
      currentTotal: 0,
      startItem: 0,
      endItem: 0,
      emptyLabel: 'No AI-matched applicants found',
      pageLabel: 'No pages',
      isPreviousPageDisabled: true,
      isNextPageDisabled: true,
    });
  });

  it('updates total from AI search only when the table state is stable', () => {
    const stableAiSearchState = {
      isLoading: false,
      tableLoading: false,
      isClearingFilters: false,
      isAiSearchActive: true,
      aiMatchedApplicantIds: ['applicant-1'],
      aiRecordCount: 17,
    };

    expect(getApplicantAiSearchTotalUpdate(stableAiSearchState)).toBe(17);
    expect(getApplicantAiSearchTotalUpdate({
      ...stableAiSearchState,
      aiMatchedApplicantIds: [],
      aiRecordCount: 0,
    })).toBe(0);
    expect(getApplicantAiSearchTotalUpdate({
      ...stableAiSearchState,
      isLoading: true,
    })).toBeNull();
    expect(getApplicantAiSearchTotalUpdate({
      ...stableAiSearchState,
      tableLoading: true,
    })).toBeNull();
    expect(getApplicantAiSearchTotalUpdate({
      ...stableAiSearchState,
      isClearingFilters: true,
    })).toBeNull();
    expect(getApplicantAiSearchTotalUpdate({
      ...stableAiSearchState,
      isAiSearchActive: false,
    })).toBeNull();
    expect(getApplicantAiSearchTotalUpdate({
      ...stableAiSearchState,
      aiMatchedApplicantIds: null,
    })).toBeNull();
  });

  it('resolves initial loading state from session and available applicant data', () => {
    expect(getApplicantInitialLoadingState({
      sessionStatus: 'loading',
      initialApplicantsCount: 0,
      filteredApplicantsCount: 0,
      hasInitialFetchError: false,
      serverAuthError: false,
      serverPermissionError: false,
    })).toEqual({
      isLoading: true,
      shouldClearTableLoading: false,
      shouldFetchReferenceData: false,
    });

    expect(getApplicantInitialLoadingState({
      sessionStatus: 'unauthenticated',
      initialApplicantsCount: 0,
      filteredApplicantsCount: 0,
      hasInitialFetchError: false,
      serverAuthError: false,
      serverPermissionError: false,
    })).toEqual({
      isLoading: false,
      shouldClearTableLoading: true,
      shouldFetchReferenceData: false,
    });

    expect(getApplicantInitialLoadingState({
      sessionStatus: 'authenticated',
      initialApplicantsCount: 0,
      filteredApplicantsCount: 0,
      hasInitialFetchError: false,
      serverAuthError: false,
      serverPermissionError: false,
    })).toEqual({
      isLoading: true,
      shouldClearTableLoading: false,
      shouldFetchReferenceData: true,
    });

    expect(getApplicantInitialLoadingState({
      sessionStatus: 'authenticated',
      initialApplicantsCount: 2,
      filteredApplicantsCount: 0,
      hasInitialFetchError: false,
      serverAuthError: false,
      serverPermissionError: false,
    }).isLoading).toBe(false);

    expect(getApplicantInitialLoadingState({
      sessionStatus: 'authenticated',
      initialApplicantsCount: 0,
      filteredApplicantsCount: 1,
      hasInitialFetchError: false,
      serverAuthError: false,
      serverPermissionError: false,
    }).isLoading).toBe(false);

    expect(getApplicantInitialLoadingState({
      sessionStatus: 'authenticated',
      initialApplicantsCount: 0,
      filteredApplicantsCount: 0,
      hasInitialFetchError: true,
      serverAuthError: false,
      serverPermissionError: false,
    }).isLoading).toBe(false);
  });

  it('resolves the initial applicant fetch action', () => {
    const baseInput = {
      sessionStatus: 'authenticated',
      serverAuthError: false,
      serverPermissionError: false,
      hasInitialDataFetch: false,
      initialApplicantsCount: 0,
      settingsLoading: false,
    };

    expect(getApplicantInitialFetchAction(baseInput)).toBe('fetch-client-data');
    expect(getApplicantInitialFetchAction({
      ...baseInput,
      initialApplicantsCount: 2,
    })).toBe('use-initial-data');
    expect(getApplicantInitialFetchAction({
      ...baseInput,
      hasInitialDataFetch: true,
    })).toBe('skip');
    expect(getApplicantInitialFetchAction({
      ...baseInput,
      sessionStatus: 'loading',
    })).toBe('skip');
    expect(getApplicantInitialFetchAction({
      ...baseInput,
      serverAuthError: true,
    })).toBe('skip');
    expect(getApplicantInitialFetchAction({
      ...baseInput,
      serverPermissionError: true,
    })).toBe('skip');
    expect(getApplicantInitialFetchAction({
      ...baseInput,
      settingsLoading: true,
    })).toBe('skip');
  });

  it('resolves applicant refresh guard states', () => {
    expect(shouldStartApplicantRealtimeRefresh({
      realtimeConnected: true,
      sessionStatus: 'authenticated',
      hasInitialDataFetch: true,
    })).toBe(true);
    expect(shouldStartApplicantRealtimeRefresh({
      realtimeConnected: false,
      sessionStatus: 'authenticated',
      hasInitialDataFetch: true,
    })).toBe(false);
    expect(shouldStartApplicantRealtimeRefresh({
      realtimeConnected: true,
      sessionStatus: 'unauthenticated',
      hasInitialDataFetch: true,
    })).toBe(false);
    expect(shouldStartApplicantRealtimeRefresh({
      realtimeConnected: true,
      sessionStatus: 'authenticated',
      hasInitialDataFetch: false,
    })).toBe(false);

    expect(shouldRefreshApplicantFitScoreCountsOnMount({
      sessionStatus: 'authenticated',
      hasInitialDataFetch: true,
      initialApplicantsCount: 2,
      hasFilters: true,
    })).toBe(true);
    expect(shouldRefreshApplicantFitScoreCountsOnMount({
      sessionStatus: 'loading',
      hasInitialDataFetch: true,
      initialApplicantsCount: 2,
      hasFilters: true,
    })).toBe(false);
    expect(shouldRefreshApplicantFitScoreCountsOnMount({
      sessionStatus: 'authenticated',
      hasInitialDataFetch: false,
      initialApplicantsCount: 2,
      hasFilters: true,
    })).toBe(false);
    expect(shouldRefreshApplicantFitScoreCountsOnMount({
      sessionStatus: 'authenticated',
      hasInitialDataFetch: true,
      initialApplicantsCount: 0,
      hasFilters: true,
    })).toBe(false);
    expect(shouldRefreshApplicantFitScoreCountsOnMount({
      sessionStatus: 'authenticated',
      hasInitialDataFetch: true,
      initialApplicantsCount: 2,
      hasFilters: false,
    })).toBe(false);
  });

  it('counts active applicant filters', () => {
    expect(countActiveApplicantFilters({
      name: 'Jane',
      selectedPositionIds: ['position-1'],
      selectedStatuses: [],
      minAppliedJobFitScore: 80,
      customFieldFilters: { department: 'Design' },
    })).toBe(4);
  });

  it('returns zero for empty filters', () => {
    expect(countActiveApplicantFilters({})).toBe(0);
    expect(countActiveApplicantFilters(null)).toBe(0);
  });

  it('builds applicant stage lookup data for display', () => {
    expect(buildApplicantStageNames([
      makeRecruitmentStage({ id: 'new', name: 'New' }),
      makeRecruitmentStage({ id: 'screening', name: 'Screening' }),
      makeRecruitmentStage({ id: '', name: 'Ignored' }),
      makeRecruitmentStage({ id: 'blank-name', name: '' }),
    ])).toEqual({
      new: 'New',
      screening: 'Screening',
    });

    expect(buildApplicantStageNames(null)).toEqual({});
  });

  it('collects unique applicant stage ids in first-seen order', () => {
    expect(getUniqueApplicantStageIds([
      makeApplicant({ id: '1', statusId: 'new' }),
      makeApplicant({ id: '2', statusId: 'screening' }),
      makeApplicant({ id: '3', statusId: 'new' }),
      makeApplicant({ id: '4', statusId: undefined }),
    ])).toEqual(['new', 'screening']);

    expect(getUniqueApplicantStageIds(null)).toEqual([]);
  });

  it('toggles horizontal fit score grade selections immutably', () => {
    const original = new Set(['A']);
    const added = toggleApplicantGradeSelection(original, 'B');
    const removed = toggleApplicantGradeSelection(added, 'A');

    expect(Array.from(original)).toEqual(['A']);
    expect(Array.from(added)).toEqual(['A', 'B']);
    expect(Array.from(removed)).toEqual(['B']);
  });

  it('detects and clears horizontal fit score filter state', () => {
    expect(hasApplicantHorizontalFitScoreSelections(new Set(), new Set())).toBe(false);
    expect(hasApplicantHorizontalFitScoreSelections(new Set(['A']), new Set())).toBe(true);
    expect(hasApplicantHorizontalFitScoreSelections(new Set(), new Set(['no-score']))).toBe(true);

    expect(hasDefinedApplicantFilterValues({ minAppliedJobFitScore: undefined })).toBe(false);
    expect(hasDefinedApplicantFilterValues({ selectedStatuses: [] })).toBe(true);

    expect(clearApplicantHorizontalFitScoreFilters({
      name: 'Jane',
      minAppliedJobFitScore: 0.7,
      maxAppliedJobFitScore: 1,
      minMatchingJobFitScore: -1,
      maxMatchingJobFitScore: -1,
      includeNoScoreInApplied: true,
      includeNoScoreInMatching: true,
    })).toEqual({
      name: 'Jane',
      minAppliedJobFitScore: undefined,
      maxAppliedJobFitScore: undefined,
      minMatchingJobFitScore: undefined,
      maxMatchingJobFitScore: undefined,
      includeNoScoreInApplied: undefined,
      includeNoScoreInMatching: undefined,
    });
  });

  it('builds horizontal fit score filter actions', () => {
    expect(getApplicantHorizontalFitScoreFilterAction({
      appliedGrades: new Set(['A']),
      matchingGrades: new Set(),
      horizontalFilters: { minAppliedJobFitScore: 0.9, maxAppliedJobFitScore: 1 },
    })).toEqual({
      type: 'merge',
      filters: { minAppliedJobFitScore: 0.9, maxAppliedJobFitScore: 1 },
    });

    expect(getApplicantHorizontalFitScoreFilterAction({
      appliedGrades: new Set(),
      matchingGrades: new Set(),
      horizontalFilters: { minAppliedJobFitScore: 0.9 },
    })).toEqual({ type: 'clear' });

    expect(getApplicantHorizontalFitScoreFilterAction({
      appliedGrades: new Set(['A']),
      matchingGrades: new Set(),
      horizontalFilters: { minAppliedJobFitScore: undefined },
    })).toEqual({ type: 'skip' });
  });

  it('builds clear-filter URL state and reset AI search state', () => {
    expect(getClearedApplicantAiSearchState()).toEqual({
      aiMatchedApplicantIds: null,
      aiSearchReasoning: null,
      aiRecordCount: 0,
      isAiSearchActive: false,
    });

    expect(buildApplicantClearFiltersUrl(
      '/applicants',
      new URLSearchParams({ query: 'designer', status: 'new', page: '2' })
    )).toBe('/applicants?status=new&page=2');

    expect(buildApplicantClearFiltersUrl('/applicants', 'query=designer')).toBe('/applicants');
    expect(buildApplicantClearFiltersUrl('/applicants', 'query=designer&ai=true&page=1', ['query', 'ai'])).toBe('/applicants?page=1');
  });

  it('detects active filter values and applicant table fetch skip states', () => {
    const baseInput = {
      sessionStatus: 'authenticated',
      serverAuthError: false,
      serverPermissionError: false,
      isClearingFilters: false,
      hasInitialDataFetch: true,
      filters: {},
      initialApplicantsCount: 0,
      page: 1,
      pageSize: 20,
      sortColumn: 'applicationDate',
      sortDirection: 'desc',
      currentRequestId: null,
    };

    expect(hasActiveApplicantFilterValues({ selectedStatuses: [] })).toBe(false);
    expect(hasActiveApplicantFilterValues({ selectedStatuses: ['new'] })).toBe(true);
    expect(hasActiveApplicantFilterValues({ name: 'Ada' })).toBe(true);
    expect(buildApplicantTableFetchRequestId(baseInput)).toBe(JSON.stringify({
      filters: {},
      page: 1,
      pageSize: 20,
      sortColumn: 'applicationDate',
      sortDirection: 'desc',
    }));
    expect(shouldSkipApplicantTableFetch({ ...baseInput, sessionStatus: 'unauthenticated' })).toBe(true);
    expect(shouldSkipApplicantTableFetch({ ...baseInput, isClearingFilters: true })).toBe(true);
    expect(shouldSkipApplicantTableFetch({ ...baseInput, initialApplicantsCount: 3 })).toBe(true);
    expect(shouldSkipApplicantTableFetch({
      ...baseInput,
      initialApplicantsCount: 3,
      hasAdvancedQuery: true,
    })).toBe(false);

    const requestId = buildApplicantTableFetchRequestId({ ...baseInput, filters: { name: 'Ada' } });
    expect(shouldSkipApplicantTableFetch({
      ...baseInput,
      filters: { name: 'Ada' },
      currentRequestId: requestId,
    })).toBe(true);
    expect(shouldSkipApplicantTableFetch({
      ...baseInput,
      filters: { name: 'Ada' },
      currentRequestId: null,
    })).toBe(false);
  });

  it('detects filter changes that should refresh fit score counts', () => {
    expect(shouldRefreshApplicantFitScoreCountsForFilterChange(
      { name: 'Ada', selectedPositionIds: ['position-1', 'position-2'] },
      { name: 'Ada', selectedPositionIds: ['position-2', 'position-1'] }
    )).toBe(false);

    expect(shouldRefreshApplicantFitScoreCountsForFilterChange(
      { name: 'Ada' },
      { name: 'Grace' }
    )).toBe(true);
  });

  it('builds initial filters from URL search params', () => {
    const filters = buildInitialApplicantFiltersFromSearchParams(undefined, new URLSearchParams({
      status: 'new,screening',
      positionId: 'position-1,position-2',
      recruiterId: 'recruiter-1',
      query: 'Jane',
    }));

    expect(filters).toEqual({
      selectedPositionIds: ['position-1', 'position-2'],
      selectedStatuses: ['new', 'screening'],
      selectedRecruiterIds: ['recruiter-1'],
      name: 'Jane',
    });
  });

  it('builds applicant export query from active filters', () => {
    const filters: ApplicantFilterValues = {
      name: 'Jane',
      email: '',
      selectedPositionIds: ['position-1', 'position-2'],
      selectedStatuses: ['Applied'],
      selectedSourceIds: [],
      selectedRecruiterIds: ['recruiter-1'],
      skills: 'React',
      minExperienceYears: 2,
      maxAppliedJobFitScore: 90,
      applicationDateStart: '2026-01-01' as unknown as Date,
      applicationDateEnd: '2026-01-31' as unknown as Date,
    };
    const query = buildApplicantExportQuery(filters);

    expect(query.toString()).toBe('name=Jane&skills=React&minExperienceYears=2&maxAppliedJobFitScore=90&applicationDateStart=2026-01-01&applicationDateEnd=2026-01-31&positionIds=position-1%2Cposition-2&status=Applied&recruiterIds=recruiter-1&format=excel');
  });

  it('builds applicant table query from standard filters and paging state', () => {
    const query = buildApplicantTableQuery({
      filters: {
        name: 'Jane',
        nameOperator: 'contains',
        email: 'jane@example.com',
        selectedPositionIds: ['position-1'],
        selectedStatuses: ['screening', 'offer'],
        minExperienceYears: -1,
        maxExperienceYears: 10,
        applicationDateStart: new Date('2026-01-01T00:00:00.000Z'),
        applicationDateEnd: new Date('2026-01-31T00:00:00.000Z'),
        selectedRecruiterIds: ['recruiter-1'],
        selectedSourceIds: ['source-1'],
        customFieldFilters: {
          department: 'Product',
          empty: '',
        },
      },
      page: 2,
      pageSize: 50,
      sortColumn: 'name',
      sortDirection: 'asc',
      advancedQuery: null,
      showPinSection: true,
    });

    expect(query.toString()).toBe(
      'name=Jane&nameOperator=contains&email=jane%40example.com&positionId=position-1&status=screening%2Coffer&minExperienceYears=-1&maxExperienceYears=10&applicationDateStart=2026-01-01T00%3A00%3A00.000Z&applicationDateEnd=2026-01-31T00%3A00%3A00.000Z&recruiterId=recruiter-1&sourceId=source-1&customField_department=Product&page=2&limit=50&sortColumn=name&sortDirection=asc&showPinSection=true'
    );
  });

  it('builds applicant table query for advanced search while preserving score filters', () => {
    const query = buildApplicantTableQuery({
      filters: {
        name: 'Ignored name',
        selectedStatuses: ['ignored-status'],
        selectedPositionIds: ['ignored-position'],
        minAppliedJobFitScore: 0.8,
        maxMatchingJobFitScore: 1,
        includeNoScoreInApplied: true,
      },
      page: 1,
      pageSize: 20,
      sortColumn: 'applicationDate',
      sortDirection: null,
      advancedQuery: ' senior designer ',
      showPinSection: false,
    });

    expect(query.toString()).toBe(
      'query=senior+designer&minAppliedJobFitScore=0.8&maxMatchingJobFitScore=1&includeNoScoreInApplied=true&page=1&limit=20&sortColumn=applicationDate&sortDirection=&showPinSection=false'
    );
  });

  it('builds pinned applicants query from supported filters', () => {
    const filters: ApplicantFilterValues = {
      aiSearchQuery: 'senior designer',
      selectedPositionIds: ['position-1', 'position-2'],
      selectedStatuses: ['screening'],
      selectedRecruiterIds: ['recruiter-1'],
      selectedSourceIds: ['source-1', 'source-2'],
      email: 'ignored@example.com',
    };
    const query = buildPinnedApplicantsQuery(filters);

    expect(query.toString()).toBe('search=senior+designer&positionId=position-1%2Cposition-2&statusId=screening&recruiterId=recruiter-1&sourceId=source-1%2Csource-2&pinnedOnly=true&limit=1000');
  });

  it('keeps pinned applicants query minimal when no filters are active', () => {
    expect(buildPinnedApplicantsQuery({}).toString()).toBe('pinnedOnly=true&limit=1000');
  });

  it('maps applicant export response statuses to user-facing messages', () => {
    expect(getApplicantExportErrorMessage(401)).toBe('Authentication required. Please refresh the page and try again.');
    expect(getApplicantExportErrorMessage(403)).toBe('No permission');
    expect(getApplicantExportErrorMessage(500)).toBe('Server error. Please try again or contact support if the problem persists.');
    expect(getApplicantExportErrorMessage(504)).toBe('Request timed out. The export may be too large. Please try with fewer filters.');
    expect(getApplicantExportErrorMessage(418)).toBe('Export failed. Please try again.');
  });

  it('fetches applicant export blobs with active filters', async () => {
    const exportedBlob = new Blob(['xlsx data']);
    const seenRequests: Array<{ input: string; init?: RequestInit }> = [];

    const result = await fetchApplicantExportBlob({
      name: 'Jane',
      selectedPositionIds: ['position-1'],
    }, async (input, init) => {
      seenRequests.push({ input, init });
      return {
        ok: true,
        status: 200,
        blob: async () => exportedBlob,
        text: async () => '',
      };
    });

    expect(result).toBe(exportedBlob);
    expect(seenRequests).toEqual([
      {
        input: '/api/applicants/export?name=Jane&positionIds=position-1&format=excel',
        init: {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      },
    ]);
  });

  it('rejects applicant export failures and empty files', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(fetchApplicantExportBlob({}, async () => ({
        ok: false,
        status: 403,
        blob: async () => new Blob(['ignored']),
        text: async () => 'Forbidden',
      }))).rejects.toThrow('No permission');

      await expect(fetchApplicantExportBlob({}, async () => ({
        ok: true,
        status: 200,
        blob: async () => new Blob([]),
        text: async () => '',
      }))).rejects.toThrow('Export returned empty file');
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('prefers provided initial filters over URL search params', () => {
    const initialFilters = {
      selectedStatuses: ['hired'],
      selectedPositionIds: [],
      selectedRecruiterIds: [],
    };

    expect(buildInitialApplicantFiltersFromSearchParams(
      initialFilters,
      new URLSearchParams({ status: 'new' })
    )).toBe(initialFilters);
  });

  it('normalizes applicant filter API data for the page', () => {
    const effectiveData = buildEffectiveApplicantFilterData({
      positions: [
        makePosition({ id: 'position-1', title: 'Designer', department: 'Product', isOpen: true }),
      ],
      stages: [
        { id: 'stage-1', name: 'Screening', description: 'Phone screen', sort_order: 2, color: '#2563eb' },
      ],
      recruiters: [
        { id: 'recruiter-1', name: 'Ada', email: 'ada@example.com', avatarUrl: '', personalColor: '#14b8a6' },
      ],
      sources: [
        { id: 'source-1', name: 'LinkedIn', description: undefined, logo: undefined },
      ],
    }, {
      positions: [],
      stages: [],
      recruiters: [],
      sources: [],
    });

    expect(effectiveData.positions).toEqual([
      { id: 'position-1', title: 'Designer', department: 'Product', isOpen: true },
    ]);
    expect(effectiveData.stages).toEqual([
      {
        id: 'stage-1',
        name: 'Screening',
        description: 'Phone screen',
        isSystem: false,
        sortOrder: 2,
        createdAt: undefined,
        updatedAt: undefined,
        color_complete: '#2563eb',
        color_badge: '#2563eb',
      },
    ]);
    expect(effectiveData.recruiters).toEqual([
      { id: 'recruiter-1', name: 'Ada', email: 'ada@example.com', avatarUrl: '', personalColor: '#14b8a6' },
    ]);
    expect(effectiveData.sources).toEqual([
      {
        id: 'source-1',
        name: 'LinkedIn',
        description: null,
        email: null,
        logo: null,
        allowSubSource: false,
        sortOrder: 0,
        isActive: true,
        createdAt: undefined,
        updatedAt: undefined,
      },
    ]);
  });

  it('falls back to existing applicant filter data when API data is absent', () => {
    const fallbackData = {
      positions: [makePosition({ id: 'position-fallback', title: 'Engineer', department: 'Platform', isOpen: true })],
      stages: [makeRecruitmentStage({ id: 'stage-fallback', name: 'Applied', isSystem: true })],
      recruiters: [{ id: 'recruiter-fallback', name: 'Grace', email: 'grace@example.com', avatarUrl: '' }],
      sources: [makeApplicantSource({ id: 'source-fallback', name: 'Referral' })],
    };

    expect(buildEffectiveApplicantFilterData(null, fallbackData)).toEqual({
      positions: fallbackData.positions,
      stages: fallbackData.stages,
      recruiters: fallbackData.recruiters,
      sources: fallbackData.sources,
    });
  });

  it('compares significant filter changes by selected id values', () => {
    expect(hasSignificantApplicantFilterChange({
      name: 'Jane',
      selectedStatuses: ['new', 'screening'],
      selectedPositionIds: ['position-1'],
    }, {
      name: 'Jane',
      selectedStatuses: ['screening', 'new'],
      selectedPositionIds: ['position-1'],
    })).toBe(false);

    expect(hasSignificantApplicantFilterChange({
      selectedStatuses: ['new'],
    }, {
      selectedStatuses: ['hired'],
    })).toBe(true);
  });

  it('builds empty applied and matching score counts', () => {
    expect(buildApplicantScoreCounts([])).toEqual({
      applied: [
        { letter: 'A', count: 0 },
        { letter: 'B', count: 0 },
        { letter: 'C', count: 0 },
        { letter: 'D', count: 0 },
        { letter: 'E', count: 0 },
        { letter: 'no-score', count: 0 },
      ],
      matching: [
        { letter: 'A', count: 0 },
        { letter: 'B', count: 0 },
        { letter: 'C', count: 0 },
        { letter: 'D', count: 0 },
        { letter: 'E', count: 0 },
        { letter: 'no-score', count: 0 },
      ],
    });
  });

  it('counts best applied and matching scores per applicant', () => {
    const counts = buildApplicantScoreCounts([
      makeApplicant({
        id: 'a',
        fitScore: 0.7,
        parsedData: {
          job_applied: { fitScore: 90 },
          job_matches: [{ fitScore: 0.4 }],
        } as unknown as Applicant['parsedData'],
        jobMatches: [makeJobMatch({ applicantId: 'a', fitScore: 62 })],
      }),
      makeApplicant({
        id: 'b',
        fitScore: undefined,
        parsedData: {},
      }),
    ]);

    expect(counts.applied).toEqual([
      { letter: 'A', count: 1 },
      { letter: 'B', count: 0 },
      { letter: 'C', count: 0 },
      { letter: 'D', count: 0 },
      { letter: 'E', count: 0 },
      { letter: 'no-score', count: 1 },
    ]);
    expect(counts.matching).toEqual([
      { letter: 'A', count: 0 },
      { letter: 'B', count: 1 },
      { letter: 'C', count: 0 },
      { letter: 'D', count: 0 },
      { letter: 'E', count: 0 },
      { letter: 'no-score', count: 1 },
    ]);
  });

  it('selects applicant score counts for AI, database, and local fallback states', () => {
    const applicants = [
      makeApplicant({ id: 'a', fitScore: 0.9 }),
      makeApplicant({ id: 'b', fitScore: undefined }),
    ];
    const databaseCounts = {
      applied: [{ letter: 'custom', count: 12 }],
      matching: [{ letter: 'custom', count: 7 }],
    };

    expect(selectApplicantScoreCountsForDisplay({
      isAiSearchActive: true,
      aiMatchedApplicantIds: ['a'],
      allApplicantsForCounts: applicants,
      databaseFitScoreCounts: databaseCounts,
    }).applied).toEqual([
      { letter: 'A', count: 1 },
      { letter: 'B', count: 0 },
      { letter: 'C', count: 0 },
      { letter: 'D', count: 0 },
      { letter: 'E', count: 0 },
      { letter: 'no-score', count: 0 },
    ]);

    expect(selectApplicantScoreCountsForDisplay({
      isAiSearchActive: false,
      aiMatchedApplicantIds: null,
      allApplicantsForCounts: applicants,
      databaseFitScoreCounts: databaseCounts,
    })).toBe(databaseCounts);

    expect(selectApplicantScoreCountsForDisplay({
      isAiSearchActive: false,
      aiMatchedApplicantIds: null,
      allApplicantsForCounts: applicants,
      databaseFitScoreCounts: null,
    }).applied).toEqual([
      { letter: 'A', count: 1 },
      { letter: 'B', count: 0 },
      { letter: 'C', count: 0 },
      { letter: 'D', count: 0 },
      { letter: 'E', count: 0 },
      { letter: 'no-score', count: 1 },
    ]);
  });

  it('selects applicants by id efficiently', () => {
    const applicants = [
      makeApplicant({ id: 'a' }),
      makeApplicant({ id: 'b' }),
      makeApplicant({ id: 'c' }),
    ];

    expect(selectApplicantsByIds(applicants, ['b', 'c']).map(applicant => applicant.id)).toEqual(['b', 'c']);
    expect(selectApplicantsByIds(applicants, [])).toEqual([]);
  });

  it('hydrates applicants with display relations by id', () => {
    const hydrated = hydrateApplicantsForDisplay([
      makeApplicant({
        id: 'a',
        positionId: 'position-1',
        recruiterId: 'recruiter-1',
        sourceId: 'source-1',
      }),
      makeApplicant({
        id: 'b',
        positionId: 'missing-position',
      }),
    ], [
      makePosition({ id: 'position-1', title: 'Designer' }),
    ], [
      { id: 'recruiter-1', name: 'Ada', email: 'ada@example.com' },
    ], [
      makeApplicantSource({ id: 'source-1', name: 'Referral' }),
    ]);

    expect(hydrated[0].position?.title).toBe('Designer');
    expect(hydrated[0].recruiter?.name).toBe('Ada');
    expect(hydrated[0].source?.name).toBe('Referral');
    expect(hydrated[1].position).toBeUndefined();
  });

  it('selects paginated AI matched applicants for display', () => {
    const applicants = [
      makeApplicant({ id: 'a' }),
      makeApplicant({ id: 'b' }),
      makeApplicant({ id: 'c' }),
      makeApplicant({ id: 'd' }),
    ];

    expect(selectPaginatedApplicantsForDisplay({
      isAiSearchActive: true,
      aiMatchedApplicantIds: ['b', 'c', 'd'],
      mappedApplicants: applicants,
      page: 2,
      pageSize: 2,
    }).map(applicant => applicant.id)).toEqual(['d']);

    expect(selectPaginatedApplicantsForDisplay({
      isAiSearchActive: false,
      aiMatchedApplicantIds: ['b'],
      mappedApplicants: applicants,
      page: 1,
      pageSize: 2,
    })).toBe(applicants);
  });

  it('falls back to filtered applicants when mapped applicants are empty', () => {
    const fallbackApplicants = [
      makeApplicant({ id: 'a' }),
      makeApplicant({ id: 'b' }),
      makeApplicant({ id: 'c' }),
    ];

    expect(selectDisplayedApplicantsForTable({
      isAiSearchActive: false,
      aiMatchedApplicantIds: null,
      mappedApplicants: [],
      filteredApplicants: fallbackApplicants,
      paginatedApplicants: [],
      page: 2,
      pageSize: 2,
    }).map(applicant => applicant.id)).toEqual(['c']);
  });

  it('keeps last non-empty applicants during transient empty states', () => {
    const previousApplicants = [makeApplicant({ id: 'previous' })];

    expect(selectApplicantsToRender([], previousApplicants, true)).toBe(previousApplicants);
    expect(selectApplicantsToRender([], previousApplicants, false)).toEqual([]);
  });

  it('splits pinned applicants without duplicating current page entries', () => {
    const pinned = [makeApplicant({ id: 'pinned' })];
    const pageApplicants = [
      makeApplicant({ id: 'pinned' }),
      makeApplicant({ id: 'regular' }),
    ];

    expect(splitPinnedApplicantsForTable(pageApplicants, pinned)).toEqual({
      pinned,
      unpinned: [pageApplicants[1]],
    });
    expect(splitPinnedApplicantsForTable(null, null)).toEqual({ pinned: [], unpinned: [] });
  });

  it('groups applicants by email while preserving first-seen email order', () => {
    const applicants = [
      makeApplicant({ id: 'a', email: 'same@example.com' }),
      makeApplicant({ id: 'b', email: '' }),
      makeApplicant({ id: 'c', email: 'same@example.com' }),
      makeApplicant({ id: 'd', email: 'other@example.com' }),
    ];

    const grouped = groupApplicantsByEmailForTable(applicants);

    expect(grouped.emailOrder).toEqual(['same@example.com', 'no-email', 'other@example.com']);
    expect(grouped.groupsByEmail['same@example.com'].map(applicant => applicant.id)).toEqual(['a', 'c']);
    expect(grouped.groupsByEmail['no-email'].map(applicant => applicant.id)).toEqual(['b']);
  });

  it('counts applicants by status id with status fallback', () => {
    expect(countApplicantsByStage([
      makeApplicant({ id: 'a', statusId: 'stage-1' }),
      makeApplicant({ id: 'b', statusId: 'stage-1' }),
      makeApplicant({ id: 'c', statusId: undefined, status: 'Applied' }),
      makeApplicant({ id: 'd', statusId: undefined, status: undefined }),
    ])).toEqual({
      'stage-1': 2,
      Applied: 1,
      unknown: 1,
    });
  });

  it('finds unique missing applicant position ids', () => {
    expect(getMissingApplicantPositionIds([
      makeApplicant({ id: 'a', positionId: 'position-1' }),
      makeApplicant({ id: 'b', positionId: 'position-2' }),
      makeApplicant({ id: 'c', positionId: 'position-2' }),
      makeApplicant({ id: 'd', positionId: undefined }),
    ], [
      { id: 'position-1' },
    ])).toEqual(['position-2']);

    expect(getMissingApplicantPositionIds(null, null)).toEqual([]);
  });

  it('merges positions without duplicating known ids', () => {
    expect(mergePositionsById([
      { id: 'position-1', title: 'Designer' },
    ], [
      { id: 'position-1', title: 'Duplicate Designer' },
      { id: 'position-2', title: 'Engineer' },
      { title: 'Invalid' },
    ])).toEqual([
      { id: 'position-1', title: 'Designer' },
      { id: 'position-2', title: 'Engineer' },
    ]);
  });
});
