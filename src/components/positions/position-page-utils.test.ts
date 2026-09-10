import { describe, expect, it } from 'vitest';
import type { Position } from '@/lib/types';
import {
  applyAssignedPositionResponse,
  applyMatchCriteriaToPositions,
  applyOptimisticRecruiterAssignment,
  buildPositionHeadcountMap,
  buildPositionFilterSnapshot,
  buildPositionListQuery,
  buildPositionPagePermissions,
  buildPositionPaginationSearch,
  buildPositionTotalPages,
  calculateVacantOpenPositionStats,
  countActivePositionFilters,
  fetchPositionDepartments,
  getAssignedPositionFromResponse,
  extractPositionApiList,
  extractUniqueDepartmentsFromPositions,
  getPositionIds,
  getNextPositionSortState,
  getPositionSelectionState,
  getPositionPaginationUpdateFromSearch,
  getPositionQueryFromSearch,
  getPositionDrawerOpenChangeAction,
  getPositionSearchKeyAction,
  getPositionSearchSyncUpdate,
  getPositionEmptyStateMessage,
  getClearedPositionVisibleFilters,
  getPositionFetchLoadingMode,
  getPositionPreferencesInitialization,
  getRecruiterAssignmentSuccessMessage,
  getRecruiterNameById,
  getRecruiterSyncApplicantCount,
  hasActivePositionLoadingState,
  hasVisiblePositionFilters,
  hasPositionStatusOrQueryInSearch,
  normalizeHiringManagers,
  normalizePositionListResponse,
  normalizePositionPreferences,
  normalizePositionRecruiterStats,
  parsePositionPageFromSearch,
  parsePositionRecruiterFromSearch,
  parsePositionStatusFromSearch,
  removePositionsByIds,
  shouldShowAddFirstPositionButton,
  shouldClearPositionPageLoading,
  shouldInitializePositionPreferences,
  shouldStartInitialPositionLoad,
  shouldStopPositionSearchAfterInputChange,
  sortPositions,
  togglePositionIdSelection,
  getChangedPositionPreferences,
} from './position-page-utils';

function makePosition(overrides: Partial<Position>): Position {
  return {
    id: overrides.id || 'position-id',
    title: overrides.title || '',
    department: overrides.department || '',
    isOpen: overrides.isOpen ?? true,
    recruiterName: overrides.recruiterName,
    ...overrides,
  } as Position;
}

describe('position page utilities', () => {
  it('builds position permissions and total pages', () => {
    expect(buildPositionPagePermissions([
      'POSITIONS_CREATE',
      'POSITIONS_RECRUITER_ASSIGN',
    ])).toEqual({
      canCreatePositions: true,
      canAssignPositionRecruiter: true,
    });

    expect(buildPositionPagePermissions(null)).toEqual({
      canCreatePositions: false,
      canAssignPositionRecruiter: false,
    });

    expect(buildPositionTotalPages(0, 20)).toBe(1);
    expect(buildPositionTotalPages(41, 20)).toBe(3);
    expect(buildPositionTotalPages(41, 0)).toBe(3);
    expect(buildPositionTotalPages(-1, 20)).toBe(1);
  });

  it('classifies position fetch loading modes', () => {
    expect(getPositionFetchLoadingMode(true, true)).toBe('search');
    expect(getPositionFetchLoadingMode(false, true)).toBe('initial');
    expect(getPositionFetchLoadingMode(false, false)).toBe('table');

    expect(shouldClearPositionPageLoading('search')).toBe(false);
    expect(shouldClearPositionPageLoading('initial')).toBe(true);
    expect(shouldClearPositionPageLoading('table')).toBe(true);

    expect(hasActivePositionLoadingState({
      isLoading: false,
      isTableLoading: false,
      isSearching: false,
    })).toBe(false);
    expect(hasActivePositionLoadingState({
      isLoading: false,
      isTableLoading: true,
      isSearching: false,
    })).toBe(true);
    expect(hasActivePositionLoadingState({
      isLoading: true,
      isTableLoading: false,
      isSearching: true,
    })).toBe(true);
  });

  it('guards the initial position load until session and preferences are ready', () => {
    expect(shouldStartInitialPositionLoad({
      hasInitialLoad: false,
      sessionUserId: 'user-1',
      isPreferencesLoaded: true,
    })).toBe(true);

    expect(shouldStartInitialPositionLoad({
      hasInitialLoad: true,
      sessionUserId: 'user-1',
      isPreferencesLoaded: true,
    })).toBe(false);

    expect(shouldStartInitialPositionLoad({
      hasInitialLoad: false,
      sessionUserId: null,
      isPreferencesLoaded: true,
    })).toBe(false);

    expect(shouldStartInitialPositionLoad({
      hasInitialLoad: false,
      sessionUserId: 'user-1',
      isPreferencesLoaded: false,
    })).toBe(false);
  });

  it('describes position drawer open-change side effects', () => {
    expect(getPositionDrawerOpenChangeAction(true)).toEqual({
      isOpen: true,
      shouldClearSelection: false,
      shouldRefreshPositions: false,
    });

    expect(getPositionDrawerOpenChangeAction(false)).toEqual({
      isOpen: false,
      shouldClearSelection: true,
      shouldRefreshPositions: true,
    });
  });

  it('stops search loading only when an active search input is cleared', () => {
    expect(shouldStopPositionSearchAfterInputChange(true, '')).toBe(true);
    expect(shouldStopPositionSearchAfterInputChange(true, 'designer')).toBe(false);
    expect(shouldStopPositionSearchAfterInputChange(false, '')).toBe(false);
  });

  it('describes position search keyboard actions', () => {
    expect(getPositionSearchKeyAction('Escape')).toEqual({
      shouldClearSearch: true,
      shouldBlurInput: true,
    });

    expect(getPositionSearchKeyAction('Enter')).toEqual({
      shouldClearSearch: false,
      shouldBlurInput: false,
    });
  });

  it('normalizes and compares persisted position preferences', () => {
    const defaults = normalizePositionPreferences(null);
    expect(defaults).toEqual({
      searchTerm: '',
      departmentFilter: 'all',
      statusFilter: 'all',
      selectedRecruiterId: null,
      pageSize: 20,
    });

    const saved = normalizePositionPreferences({
      searchTerm: 'designer',
      departmentFilter: 'Product',
      statusFilter: 'open',
      selectedRecruiterId: 'recruiter-1',
      pageSize: 50,
    });
    expect(saved).toEqual({
      searchTerm: 'designer',
      departmentFilter: 'Product',
      statusFilter: 'open',
      selectedRecruiterId: 'recruiter-1',
      pageSize: 50,
    });
    expect(normalizePositionPreferences({ statusFilter: 'archived' }).statusFilter).toBe('all');
    expect(getChangedPositionPreferences(saved, saved)).toBeNull();
    expect(getChangedPositionPreferences({ ...saved, pageSize: 100 }, saved)).toEqual({ ...saved, pageSize: 100 });
  });

  it('builds position preferences initialization from saved preferences and URL state', () => {
    expect(shouldInitializePositionPreferences(true, false)).toBe(true);
    expect(shouldInitializePositionPreferences(false, false)).toBe(false);
    expect(shouldInitializePositionPreferences(true, true)).toBe(false);

    const initialization = getPositionPreferencesInitialization({
      searchTerm: 'designer',
      departmentFilter: 'Product',
      statusFilter: 'closed',
      selectedRecruiterId: 'recruiter-1',
      pageSize: 50,
    }, '?page=2');

    expect(initialization).toEqual({
      preferences: {
        searchTerm: 'designer',
        departmentFilter: 'Product',
        statusFilter: 'closed',
        selectedRecruiterId: 'recruiter-1',
        pageSize: 50,
      },
      shouldApplyStatusFilter: true,
    });

    expect(getPositionPreferencesInitialization({ statusFilter: 'closed' }, '?status=open').shouldApplyStatusFilter).toBe(false);
    expect(getPositionPreferencesInitialization({ statusFilter: 'closed' }, '?query=status%3Aopen').shouldApplyStatusFilter).toBe(false);
  });

  it('counts active visible filters', () => {
    expect(buildPositionFilterSnapshot({
      searchTerm: 'designer',
      statusFilter: 'open',
      departmentFilter: 'Product',
      gradeFilter: 'grade-1',
      selectedRecruiterId: 'recruiter-1',
      selectedHiringManagerId: 'manager-1',
      page: 2,
      pageSize: 50,
    })).toEqual({
      searchTerm: 'designer',
      statusFilter: 'open',
      departmentFilter: 'Product',
      gradeFilter: 'grade-1',
      selectedRecruiterId: 'recruiter-1',
      selectedHiringManagerId: 'manager-1',
      page: 2,
      pageSize: 50,
    });

    expect(countActivePositionFilters({
      searchTerm: 'designer',
      statusFilter: 'all',
      departmentFilter: 'all',
      gradeFilter: null,
      selectedRecruiterId: null,
      selectedHiringManagerId: 'manager-1',
    })).toBe(2);

    expect(countActivePositionFilters({
      searchTerm: '',
      statusFilter: 'open',
      departmentFilter: 'Engineering',
      gradeFilter: 'grade-1',
      selectedRecruiterId: 'unassigned',
      selectedHiringManagerId: null,
    })).toBe(4);
  });

  it('derives visible filter and empty-state flags', () => {
    const noFilters = {
      searchTerm: '',
      statusFilter: 'all' as const,
      departmentFilter: 'all',
      selectedRecruiterId: null,
    };
    const withFilters = {
      ...noFilters,
      selectedHiringManagerId: 'manager-1',
    };
    const withGradeFilter = {
      ...noFilters,
      gradeFilter: 'grade-1',
    };

    expect(hasVisiblePositionFilters(noFilters)).toBe(false);
    expect(hasVisiblePositionFilters(withFilters)).toBe(true);
    expect(hasVisiblePositionFilters(withGradeFilter)).toBe(true);
    expect(getPositionEmptyStateMessage(noFilters)).toBe('Get started by adding your first position');
    expect(getPositionEmptyStateMessage(withFilters)).toBe('Try adjusting your filters');
    expect(shouldShowAddFirstPositionButton(true, noFilters)).toBe(true);
    expect(shouldShowAddFirstPositionButton(true, withFilters)).toBe(false);
    expect(shouldShowAddFirstPositionButton(false, noFilters)).toBe(false);
  });

  it('returns the canonical cleared visible filter state', () => {
    expect(getClearedPositionVisibleFilters()).toEqual({
      searchTerm: '',
      statusFilter: 'all',
      departmentFilter: 'all',
      gradeFilter: null,
      selectedRecruiterId: null,
      selectedHiringManagerId: null,
    });
  });

  it('cycles a repeated column through desc and unsorted', () => {
    expect(getNextPositionSortState('title', 'asc', 'title')).toEqual({
      sortColumn: 'title',
      sortDirection: 'desc',
    });

    expect(getNextPositionSortState('title', 'desc', 'title')).toEqual({
      sortColumn: 'title',
      sortDirection: null,
    });
  });

  it('sorts positions by visible table fields', () => {
    const positions = [
      makePosition({ id: '2', title: 'Backend Engineer', isOpen: false }),
      makePosition({ id: '1', title: 'Analytics Lead', isOpen: true }),
    ];

    expect(sortPositions(positions, 'title', 'asc').map(position => position.id)).toEqual(['1', '2']);
    expect(sortPositions(positions, 'status', 'asc').map(position => position.id)).toEqual(['2', '1']);
  });

  it('builds the position list API query from filters', () => {
    const query = buildPositionListQuery({
      searchTerm: 'engineer',
      statusFilter: 'open',
      departmentFilter: 'Product',
      selectedRecruiterId: 'unassigned',
      selectedHiringManagerId: 'manager-1',
      gradeFilter: 'grade-1',
      page: 2,
      pageSize: 20,
    });

    expect(query.toString()).toBe('title=engineer&isOpen=true&department=Product&recruiterId=null&hiringManagerId=manager-1&gradeId=grade-1&limit=20&offset=20&includeStats=true&includeapplicantStats=true&includeHeadcount=true');
  });

  it('maps position headcount data by position id', () => {
    const map = buildPositionHeadcountMap([
      makePosition({
        id: 'position-1',
        headcountData: { total: 3, vacant: 1 },
      } as Partial<Position>),
      makePosition({ id: 'position-2' }),
    ] as Array<Position & { headcountData?: { total?: number; vacant?: number; filled?: number } }>);

    expect(map).toEqual({
      'position-1': {
        total: 3,
        vacant: 1,
        filled: 0,
      },
    });
  });

  it('normalizes position list API responses with total and headcount data', () => {
    const response = normalizePositionListResponse({
      data: [
        makePosition({
          id: 'position-1',
          headcountData: { total: 4, vacant: 2, filled: 2 },
        } as Partial<Position>),
        makePosition({ id: 'position-2' }),
      ],
      total: 12,
    });

    expect(response.positions.map(position => position.id)).toEqual(['position-1', 'position-2']);
    expect(response.total).toBe(12);
    expect(response.headcountData).toEqual({
      'position-1': {
        total: 4,
        vacant: 2,
        filled: 2,
      },
    });

    expect(normalizePositionListResponse({ data: null, total: '12' })).toEqual({
      positions: [],
      total: 0,
      headcountData: {},
    });
  });

  it('calculates vacant headcount for open positions only', () => {
    expect(calculateVacantOpenPositionStats([
      makePosition({ id: 'open-1', isOpen: true }),
      makePosition({ id: 'closed-1', isOpen: false }),
      makePosition({ id: 'open-missing-headcount', isOpen: true }),
      makePosition({ id: 'open-2', isOpen: true }),
    ], {
      'open-1': { vacant: 2 },
      'closed-1': { vacant: 10 },
      'open-2': { vacant: 1 },
    })).toEqual({
      vacant: 3,
      totalOpen: 2,
    });
  });

  it('normalizes recruiter headcount responses for sidebar stats', () => {
    expect(normalizePositionRecruiterStats({
      recruiters: [
        { id: 'recruiter-1', name: 'Ada', avatarUrl: '/ada.png', totalPositions: 4, vacantHeadcount: 2 },
        { id: 'bad-recruiter', totalPositions: 9 },
      ],
      unassigned: { totalPositions: 3, vacantHeadcount: 1 },
    })).toEqual({
      availableRecruiters: [
        { id: 'recruiter-1', name: 'Ada', avatarUrl: '/ada.png', personalColor: undefined, vacantHeadcount: 2 },
      ],
      stats: {
        'recruiter-1': 4,
        'bad-recruiter': 9,
        unassigned: 3,
        unassignedVacant: 1,
      },
    });
  });

  it('extracts unique sorted departments from position API payloads', () => {
    const data = {
      data: [
        { department: 'Engineering' },
        { department: 'People' },
        { department: 'Engineering' },
        { department: null },
      ],
    };

    expect(extractPositionApiList(data)).toHaveLength(4);
    expect(extractUniqueDepartmentsFromPositions(extractPositionApiList(data))).toEqual(['Engineering', 'People']);
    expect(extractUniqueDepartmentsFromPositions(null)).toEqual([]);
  });

  it('fetches position departments from primary and fallback endpoints', async () => {
    const primaryCalls: string[] = [];
    await expect(fetchPositionDepartments(async (input) => {
      primaryCalls.push(input);
      return {
        ok: true,
        data: {
          data: [
            { department: 'People' },
            { department: 'Engineering' },
            { department: 'People' },
          ],
        },
      };
    })).resolves.toEqual(['Engineering', 'People']);
    expect(primaryCalls).toEqual(['/api/positions/all']);

    const fallbackCalls: string[] = [];
    await expect(fetchPositionDepartments(async (input) => {
      fallbackCalls.push(input);
      return input === '/api/positions/all'
        ? { ok: false, data: null }
        : { ok: true, data: { data: [{ department: 'Sales' }] } };
    })).resolves.toEqual(['Sales']);
    expect(fallbackCalls).toEqual(['/api/positions/all', '/api/positions?limit=1000']);
  });

  it('returns empty departments when primary and fallback requests fail', async () => {
    await expect(fetchPositionDepartments(async () => {
      throw new Error('network down');
    })).resolves.toEqual([]);
  });

  it('normalizes hiring manager API users', () => {
    expect(normalizeHiringManagers({
      users: [
        { id: 'manager-1', name: 'Grace', role: 'Hiring Manager' },
        { id: 'manager-2' },
      ],
    })).toEqual([{ id: 'manager-1', name: 'Grace' }]);
  });

  it('builds visible position selection state and ids', () => {
    const positions = [
      makePosition({ id: 'position-1' }),
      makePosition({ id: 'position-2' }),
    ];

    expect(getPositionIds(positions)).toEqual(['position-1', 'position-2']);
    expect(getPositionSelectionState(['position-1'], positions)).toEqual({
      allSelected: false,
      someSelected: true,
    });
    expect(getPositionSelectionState(['position-1', 'position-2', 'stale-id'], positions)).toEqual({
      allSelected: true,
      someSelected: false,
    });
  });

  it('updates selected ids and selected positions immutably', () => {
    expect(togglePositionIdSelection(['position-1'], 'position-2', true)).toEqual(['position-1', 'position-2']);
    expect(togglePositionIdSelection(['position-1'], 'position-1', true)).toEqual(['position-1']);
    expect(togglePositionIdSelection(['position-1', 'position-2'], 'position-1', false)).toEqual(['position-2']);

    const positions = [
      makePosition({ id: 'position-1' }),
      makePosition({ id: 'position-2', matchCriteria: 'old' } as Partial<Position>),
    ];

    expect(removePositionsByIds(positions, ['position-1']).map(position => position.id)).toEqual(['position-2']);
    expect(applyMatchCriteriaToPositions(positions, ['position-2'], 'new')[1].matchCriteria).toBe('new');
  });

  it('applies optimistic recruiter assignment updates', () => {
    const positions = [
      makePosition({ id: 'position-1', recruiterId: null, recruiterName: null }),
      makePosition({ id: 'position-2', recruiterId: 'old', recruiterName: 'Old' }),
    ];

    expect(getRecruiterNameById([{ id: 'recruiter-1', name: 'Ada' }], 'recruiter-1')).toBe('Ada');
    expect(getRecruiterNameById([{ id: 'recruiter-1', name: 'Ada' }], null)).toBeNull();
    expect(applyOptimisticRecruiterAssignment(positions, 'position-1', 'recruiter-1', 'Ada')[0]).toMatchObject({
      recruiterId: 'recruiter-1',
      recruiterName: 'Ada',
    });
  });

  it('merges assigned position responses with fallback recruiter names and custom attributes', () => {
    const positions = [
      makePosition({ id: 'position-1', title: 'Engineer', recruiterId: null, recruiterName: null }),
    ];
    const responsePosition = getAssignedPositionFromResponse({
      position: {
        id: 'position-1',
        recruiterId: 'recruiter-1',
        customAttributes: { team: 'Platform' },
      },
    });

    expect(responsePosition).not.toBeNull();
    expect(getAssignedPositionFromResponse({})).toBeNull();

    const updated = applyAssignedPositionResponse(
      positions,
      'position-1',
      responsePosition!,
      'Ada'
    )[0] as Position & { custom_attributes?: Record<string, unknown> };

    expect(updated).toMatchObject({
      id: 'position-1',
      recruiterId: 'recruiter-1',
      recruiterName: 'Ada',
    });
    expect(updated.custom_attributes).toEqual({ team: 'Platform' });
  });

  it('builds recruiter assignment success messages from sync data', () => {
    expect(getRecruiterSyncApplicantCount({ recruiterSync: { applicantsUpdated: 2 } })).toBe(2);
    expect(getRecruiterSyncApplicantCount({ recruiterSync: {} })).toBe(0);
    expect(getRecruiterAssignmentSuccessMessage('recruiter-1', 2)).toBe(
      'Recruiter assigned successfully. 2 applicants automatically assigned.'
    );
    expect(getRecruiterAssignmentSuccessMessage('recruiter-1', 0)).toBe('Recruiter assigned successfully');
    expect(getRecruiterAssignmentSuccessMessage(null, 0)).toBe('Recruiter unassigned successfully');
  });

  it('parses position status from URL status and dashboard query params', () => {
    expect(parsePositionStatusFromSearch('?status=open', 'all')).toBe('open');
    expect(parsePositionStatusFromSearch('?query=status%3AClosed', 'open')).toBe('closed');
    expect(parsePositionStatusFromSearch('?query=designer', 'closed')).toBe('closed');
  });

  it('derives URL search sync updates without repeating unchanged values', () => {
    expect(getPositionSearchSyncUpdate('?status=open&query=backend', 'all', '')).toEqual({
      statusFilter: 'open',
      searchTerm: 'backend',
    });

    expect(getPositionSearchSyncUpdate('?status=open&query=backend', 'open', 'backend')).toEqual({
      statusFilter: undefined,
      searchTerm: undefined,
    });

    expect(getPositionSearchSyncUpdate('?query=status%3Aclosed', 'open', '')).toEqual({
      statusFilter: 'closed',
      searchTerm: 'status:closed',
    });
  });

  it('parses pagination and recruiter URL state safely', () => {
    expect(parsePositionPageFromSearch('?page=3')).toBe(3);
    expect(parsePositionPageFromSearch('?page=-1', 2)).toBe(2);
    expect(parsePositionRecruiterFromSearch('?recruiterId=all', 'recruiter-1')).toBeNull();
    expect(parsePositionRecruiterFromSearch('?recruiterId=recruiter-2')).toBe('recruiter-2');
    expect(getPositionQueryFromSearch('?query=backend')).toBe('backend');
    expect(hasPositionStatusOrQueryInSearch('?status=open')).toBe(true);
    expect(hasPositionStatusOrQueryInSearch('?page=2')).toBe(false);
  });

  it('detects pagination updates from URL state', () => {
    expect(getPositionPaginationUpdateFromSearch('?page=2&pageSize=50', 1, 20)).toEqual({
      page: 2,
      pageSize: 50,
      shouldUpdatePage: true,
      shouldUpdatePageSize: true,
    });

    expect(getPositionPaginationUpdateFromSearch('?page=nope&pageSize=0', 1, 20)).toEqual({
      page: 1,
      pageSize: 20,
      shouldUpdatePage: false,
      shouldUpdatePageSize: false,
    });
  });

  it('builds pagination search while preserving existing params', () => {
    expect(buildPositionPaginationSearch('?status=open&page=1', 3, 50)).toBe('status=open&page=3&pageSize=50');
  });
});
