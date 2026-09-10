import { describe, expect, it } from 'vitest';

import {
  areApplicantFilterSnapshotsEqual,
  areStringSetsEqual,
  addApplicantSkill,
  addApplicantQueryToHistory,
  applyApplicantFilterSyncState,
  buildApplicantCurrentFilterSyncState,
  buildApplicantFilterStateSignal,
  buildStandardApplicantFilters,
  buildApplicantFilterSyncState,
  cleanApplicantCustomFieldFilters,
  createApplicantSkillsSet,
  createAdvancedApplicantFiltersPayload,
  createClearedApplicantFiltersPayload,
  getApplicantFilterAutoApplyDecision,
  getApplicantPositionFilterApplyDecision,
  getApplicantStandardFilterApplyDecision,
  getTrimmedApplicantAiSearchQuery,
  getVisibleApplicantFilterOptions,
  hasActiveApplicantFilterState,
  hasEmptyApplicantTextFilters,
  hasApplicantUrlFilterValues,
  mergeApplicantSkillsFromText,
  parseApplicantSkillTokens,
  parseApplicantFilterDateRange,
  removeApplicantQueryHistoryItem,
  removeApplicantSkill,
  removeLastApplicantSkill,
  toApplicantPositionOptions,
  toApplicantRecruiterOptions,
  toApplicantSourceOptions,
  toApplicantStageOptions,
  toggleApplicantQueryHistoryVisibility,
  toggleStringSetItem,
  type ApplicantFilterSyncStateSetters,
} from './applicant-filter-query-utils';

describe('applicant filter query utilities', () => {
  it('parses serialized applicant date filters into a date range', () => {
    const range = parseApplicantFilterDateRange({
      applicationDateStart: '2024-01-01',
      applicationDateEnd: '2024-01-31',
    });

    expect(range?.from?.getFullYear()).toBe(2024);
    expect(range?.from?.getMonth()).toBe(0);
    expect(range?.from?.getDate()).toBe(1);
    expect(range?.to?.getFullYear()).toBe(2024);
    expect(range?.to?.getMonth()).toBe(0);
    expect(range?.to?.getDate()).toBe(31);
  });

  it('returns undefined when no date filters exist', () => {
    expect(parseApplicantFilterDateRange({})).toBeUndefined();
  });

  it('compares string sets independent of identity', () => {
    expect(areStringSetsEqual(new Set(['a', 'b']), new Set(['b', 'a']))).toBe(true);
    expect(areStringSetsEqual(new Set(['a']), new Set(['a', 'b']))).toBe(false);
  });

  it('toggles string set membership immutably', () => {
    const original = new Set(['a']);
    const added = toggleStringSetItem(original, 'b');
    expect(Array.from(added)).toEqual(['a', 'b']);
    expect(Array.from(original)).toEqual(['a']);

    expect(Array.from(toggleStringSetItem(added, 'a'))).toEqual(['b']);
  });

  it('maps applicant filter entities to see-more options defensively', () => {
    expect(toApplicantStageOptions([{ id: 'stage-1', name: 'Applied' }])).toEqual([
      { id: 'stage-1', label: 'Applied' },
    ]);
    expect(toApplicantPositionOptions([{ id: 'position-1', title: 'Engineer' }])).toEqual([
      { id: 'position-1', label: 'Engineer' },
    ]);
    expect(toApplicantRecruiterOptions([{ id: 'recruiter-1', name: 'Ada' }])).toEqual([
      { id: 'recruiter-1', label: 'Ada' },
    ]);
    expect(toApplicantSourceOptions([{ id: 'source-1', name: 'LinkedIn' }])).toEqual([
      { id: 'source-1', label: 'LinkedIn' },
    ]);
    expect(toApplicantSourceOptions(null)).toEqual([]);
  });

  it('calculates visible applicant filter options for collapsed and expanded states', () => {
    const options = Array.from({ length: 7 }, (_, index) => ({
      id: `option-${index}`,
      label: `Option ${index}`,
    }));

    expect(getVisibleApplicantFilterOptions(options, false, 5)).toEqual({
      visibleOptions: options.slice(0, 5),
      hasMore: true,
      remainingCount: 2,
    });
    expect(getVisibleApplicantFilterOptions(options, true, 5)).toEqual({
      visibleOptions: options,
      hasMore: true,
      remainingCount: 2,
    });
  });

  it('compares current local filter state with incoming filter props', () => {
    expect(areApplicantFilterSnapshotsEqual({
      name: 'Jane',
      email: '',
      phone: '',
      selectedPositionIds: new Set(['position-1']),
      selectedStatuses: new Set(),
      selectedSourceIds: new Set(),
      skills: new Set(['React']),
      location: '',
      locationOperator: 'contains',
      experienceYearsRange: [0, 50],
      selectedRecruiterIds: new Set(),
      customFieldFilters: {},
    }, {
      name: 'Jane',
      selectedPositionIds: ['position-1'],
      skills: 'React',
      locationOperator: 'contains',
    })).toBe(true);
  });

  it('builds applicant filter state objects for sync effects and apply actions', () => {
    const from = new Date('2024-02-01T00:00:00.000Z');
    const input = {
      name: 'Jane',
      nameOperator: 'startsWith' as const,
      email: 'jane@example.com',
      emailOperator: 'contains' as const,
      phone: '123',
      phoneOperator: 'contains' as const,
      selectedPositionIds: new Set(['position-1']),
      selectedStatuses: new Set(['stage-1']),
      selectedSourceIds: new Set(['source-1']),
      selectedRecruiterIds: new Set(['recruiter-1']),
      skills: new Set(['React']),
      location: 'Bangkok',
      locationOperator: 'is' as const,
      experienceYearsRange: [2, 6] as [number, number],
      applicationDateRange: { from },
      customFieldFilters: { level: 'senior' },
    };

    expect(buildApplicantCurrentFilterSyncState(input)).toEqual({
      name: 'Jane',
      email: 'jane@example.com',
      phone: '123',
      selectedPositionIds: input.selectedPositionIds,
      selectedStatuses: input.selectedStatuses,
      selectedSourceIds: input.selectedSourceIds,
      skills: input.skills,
      location: 'Bangkok',
      locationOperator: 'is',
      experienceYearsRange: [2, 6],
      applicationDateRange: { from },
      selectedRecruiterIds: input.selectedRecruiterIds,
      customFieldFilters: { level: 'senior' },
    });
    expect(buildApplicantFilterStateSignal(input)).toEqual({
      name: 'Jane',
      nameOperator: 'startsWith',
      email: 'jane@example.com',
      emailOperator: 'contains',
      phone: '123',
      phoneOperator: 'contains',
      location: 'Bangkok',
      locationOperator: 'is',
      selectedPositionIds: input.selectedPositionIds,
      selectedStatuses: input.selectedStatuses,
      selectedRecruiterIds: input.selectedRecruiterIds,
      selectedSourceIds: input.selectedSourceIds,
      skills: input.skills,
      experienceYearsRange: [2, 6],
      applicationDateRange: { from },
      customFieldFilters: { level: 'senior' },
    });
  });

  it('builds local sync state from incoming applicant filters', () => {
    const from = new Date('2024-02-01T00:00:00.000Z');
    const syncState = buildApplicantFilterSyncState({
      name: 'Jane',
      selectedPositionIds: ['position-1'],
      selectedStatuses: ['stage-1'],
      selectedSourceIds: ['source-1'],
      selectedRecruiterIds: ['recruiter-1'],
      skills: 'React,TypeScript',
      locationOperator: 'startsWith',
      minExperienceYears: 2,
      maxExperienceYears: 6,
      applicationDateStart: from,
      aiSearchQuery: 'senior engineer',
      customFieldFilters: { level: 'senior' },
    });

    expect(syncState).toMatchObject({
      name: 'Jane',
      locationOperator: 'startsWith',
      experienceYearsRange: [2, 6],
      applicationDateRange: { from },
      aiSearchQueryInput: 'senior engineer',
      customFieldFilters: { level: 'senior' },
    });
    expect(Array.from(syncState.selectedPositionIds)).toEqual(['position-1']);
    expect(Array.from(syncState.selectedStatuses)).toEqual(['stage-1']);
    expect(Array.from(syncState.selectedSourceIds)).toEqual(['source-1']);
    expect(Array.from(syncState.selectedRecruiterIds)).toEqual(['recruiter-1']);
    expect(Array.from(syncState.skills)).toEqual(['React', 'TypeScript']);
  });

  it('applies applicant filter sync state to local state setters', () => {
    const calls: Record<string, unknown[]> = {};
    const setters = new Proxy({}, {
      get: (_target, property) => (value: unknown) => {
        const key = String(property);
        calls[key] = [...(calls[key] || []), value];
      },
    }) as unknown as ApplicantFilterSyncStateSetters;
    const from = new Date('2024-02-01T00:00:00.000Z');
    const syncState = buildApplicantFilterSyncState({
      name: 'Jane',
      email: 'jane@example.com',
      phone: '123',
      selectedPositionIds: ['position-1'],
      selectedStatuses: ['stage-1'],
      selectedSourceIds: ['source-1'],
      selectedRecruiterIds: ['recruiter-1'],
      skills: 'React,TypeScript',
      location: 'Bangkok',
      minExperienceYears: 2,
      maxExperienceYears: 6,
      applicationDateStart: from,
      aiSearchQuery: 'senior engineer',
      customFieldFilters: { level: 'senior' },
    });

    applyApplicantFilterSyncState({ syncState, setters });

    expect(calls.setName).toEqual(['Jane']);
    expect(calls.setEmail).toEqual(['jane@example.com']);
    expect(calls.setPhone).toEqual(['123']);
    expect(Array.from(calls.setSelectedPositionIds[0] as Set<string>)).toEqual(['position-1']);
    expect(Array.from(calls.setSelectedStatuses[0] as Set<string>)).toEqual(['stage-1']);
    expect(Array.from(calls.setSelectedSourceIds[0] as Set<string>)).toEqual(['source-1']);
    expect(Array.from(calls.setSelectedRecruiterIds[0] as Set<string>)).toEqual(['recruiter-1']);
    expect(Array.from(calls.setSkills[0] as Set<string>)).toEqual(['React', 'TypeScript']);
    expect(calls.setLocation).toEqual(['Bangkok']);
    expect(calls.setExperienceYearsRange).toEqual([[2, 6]]);
    expect(calls.setApplicationDateRange).toEqual([{ from }]);
    expect(calls.setAiSearchQueryInput).toEqual(['senior engineer']);
    expect(calls.setCustomFieldFilters).toEqual([{ level: 'senior' }]);
  });

  it('skips unchanged set and range sync updates while preserving typing fields', () => {
    const calls: Record<string, unknown[]> = {};
    const setters = new Proxy({}, {
      get: (_target, property) => (value: unknown) => {
        const key = String(property);
        calls[key] = [...(calls[key] || []), value];
      },
    }) as unknown as ApplicantFilterSyncStateSetters;
    const syncState = buildApplicantFilterSyncState({
      name: 'Incoming name',
      email: 'incoming@example.com',
      selectedPositionIds: ['position-1'],
      selectedStatuses: ['stage-1'],
      selectedSourceIds: ['source-1'],
      selectedRecruiterIds: ['recruiter-1'],
      skills: 'React',
      location: 'Incoming location',
      minExperienceYears: 2,
      maxExperienceYears: 6,
    });

    applyApplicantFilterSyncState({
      syncState,
      setters,
      currentState: {
        selectedPositionIds: new Set(['position-1']),
        selectedStatuses: new Set(['stage-1']),
        selectedSourceIds: new Set(['source-1']),
        selectedRecruiterIds: new Set(['recruiter-1']),
        skills: new Set(['React']),
        experienceYearsRange: [2, 6],
      },
      isTypingName: true,
      isTypingLocation: true,
    });

    expect(calls.setName).toBeUndefined();
    expect(calls.setLocation).toBeUndefined();
    expect(calls.setSelectedPositionIds).toBeUndefined();
    expect(calls.setSelectedStatuses).toBeUndefined();
    expect(calls.setSelectedSourceIds).toBeUndefined();
    expect(calls.setSelectedRecruiterIds).toBeUndefined();
    expect(calls.setSkills).toBeUndefined();
    expect(calls.setExperienceYearsRange).toBeUndefined();
    expect(calls.setEmail).toEqual(['incoming@example.com']);
    expect(calls.setApplicationDateRange).toEqual([undefined]);
  });

  it('cleans empty custom fields while preserving valid falsy values', () => {
    expect(cleanApplicantCustomFieldFilters({
      available: false,
      empty: '',
      ignoredNull: null,
      ignoredUndefined: undefined,
      level: 0,
      note: 'remote',
    })).toEqual({
      available: false,
      level: 0,
      note: 'remote',
    });
  });

  it('builds a compact standard applicant filter payload', () => {
    const from = new Date('2024-01-01T00:00:00.000Z');
    const filters = buildStandardApplicantFilters({
      name: 'Jane',
      nameOperator: 'startsWith',
      email: '',
      emailOperator: 'contains',
      phone: '',
      phoneOperator: 'contains',
      selectedPositionIds: new Set(['position-1']),
      selectedStatuses: new Set(['applied']),
      selectedSourceIds: new Set(),
      skills: new Set(['React', 'TypeScript']),
      location: 'Bangkok',
      locationOperator: 'is',
      experienceYearsRange: [3, 50],
      applicationDateRange: { from },
      selectedRecruiterIds: new Set(['recruiter-1']),
      customFieldFilters: { available: false, empty: '' },
    });

    expect(filters).toEqual({
      name: 'Jane',
      nameOperator: 'startsWith',
      email: '',
      phone: '',
      selectedPositionIds: ['position-1'],
      selectedStatuses: ['applied'],
      skills: 'React,TypeScript',
      location: 'Bangkok',
      locationOperator: 'is',
      minExperienceYears: 3,
      applicationDateStart: from,
      selectedRecruiterIds: ['recruiter-1'],
      customFieldFilters: { available: false },
    });
  });

  it('can omit empty text filters for immediate dropdown updates', () => {
    const filters = buildStandardApplicantFilters({
      name: '',
      nameOperator: 'contains',
      email: '',
      emailOperator: 'contains',
      phone: '',
      phoneOperator: 'contains',
      selectedPositionIds: new Set(['position-1']),
      selectedStatuses: new Set(),
      selectedSourceIds: new Set(),
      skills: new Set(),
      location: '',
      locationOperator: 'contains',
      experienceYearsRange: [-1, 50],
      selectedRecruiterIds: new Set(),
      customFieldFilters: {},
    }, { preserveEmptyTextFilters: false });

    expect(filters).toEqual({
      selectedPositionIds: ['position-1'],
    });
  });

  it('detects explicit empty text filters used to clear previous filters', () => {
    expect(hasEmptyApplicantTextFilters({
      name: '',
      email: 'jane@example.com',
      phone: '',
      location: 'Bangkok',
    })).toBe(true);

    expect(hasEmptyApplicantTextFilters({
      name: 'Jane',
      email: 'jane@example.com',
      phone: '123',
      location: 'Bangkok',
    })).toBe(false);
  });

  it('decides when standard applicant filters should be applied', () => {
    expect(getApplicantStandardFilterApplyDecision({
      filters: { name: 'Jane' },
      lastAppliedFiltersKey: '',
      hasEmptyTextFilters: false,
    })).toEqual({
      type: 'apply',
      nextLastAppliedFiltersKey: JSON.stringify({ name: 'Jane' }),
      filters: { name: 'Jane' },
    });

    const duplicateKey = JSON.stringify({ name: 'Jane' });
    expect(getApplicantStandardFilterApplyDecision({
      filters: { name: 'Jane' },
      lastAppliedFiltersKey: duplicateKey,
      hasEmptyTextFilters: false,
    })).toEqual({
      type: 'skip',
      nextLastAppliedFiltersKey: duplicateKey,
      filters: null,
    });

    expect(getApplicantStandardFilterApplyDecision({
      filters: {},
      lastAppliedFiltersKey: 'previous',
      hasEmptyTextFilters: false,
    })).toEqual({
      type: 'apply',
      nextLastAppliedFiltersKey: 'previous',
      filters: {},
    });

    expect(getApplicantStandardFilterApplyDecision({
      filters: { name: '' },
      lastAppliedFiltersKey: 'previous',
      hasEmptyTextFilters: true,
    })).toEqual({
      type: 'apply',
      nextLastAppliedFiltersKey: JSON.stringify({ name: '' }),
      filters: { name: '' },
    });
  });

  it('decides when standard applicant filters should auto-apply', () => {
    const readyInput = {
      isInitialLoad: false,
      isSyncingFromInitialFilters: false,
      isComponentInitialized: true,
      isHandlingPositionChange: false,
      isApplyingFilters: false,
      advancedQueryInput: '',
      autoApply: true,
    };

    expect(getApplicantFilterAutoApplyDecision(readyInput)).toEqual({
      type: 'schedule',
      delayMs: 100,
    });
    expect(getApplicantFilterAutoApplyDecision({
      ...readyInput,
      delayMs: 250,
    })).toEqual({
      type: 'schedule',
      delayMs: 250,
    });
    expect(getApplicantFilterAutoApplyDecision({
      ...readyInput,
      advancedQueryInput: 'status:hired',
    })).toEqual({ type: 'skip' });
    expect(getApplicantFilterAutoApplyDecision({
      ...readyInput,
      isHandlingPositionChange: true,
    })).toEqual({ type: 'skip' });
    expect(getApplicantFilterAutoApplyDecision({
      ...readyInput,
      autoApply: false,
    })).toEqual({ type: 'skip' });
  });

  it('decides whether position filter changes should apply immediately', () => {
    const filters = { selectedPositionIds: ['position-1'] };
    const filtersKey = JSON.stringify(filters);

    expect(getApplicantPositionFilterApplyDecision({
      now: 1100,
      lastPositionChangeTime: 1000,
      filters,
      lastAppliedFiltersKey: '',
    })).toEqual({
      type: 'skip-throttle',
      nextLastPositionChangeTime: 1000,
      nextLastAppliedFiltersKey: '',
      filters: null,
    });

    expect(getApplicantPositionFilterApplyDecision({
      now: 1300,
      lastPositionChangeTime: 1000,
      filters,
      lastAppliedFiltersKey: filtersKey,
    })).toEqual({
      type: 'skip-duplicate',
      nextLastPositionChangeTime: 1300,
      nextLastAppliedFiltersKey: filtersKey,
      filters: null,
    });

    expect(getApplicantPositionFilterApplyDecision({
      now: 1300,
      lastPositionChangeTime: 1000,
      filters,
      lastAppliedFiltersKey: '',
    })).toEqual({
      type: 'apply',
      nextLastPositionChangeTime: 1300,
      nextLastAppliedFiltersKey: filtersKey,
      filters,
    });
  });

  it('detects active applicant filter state', () => {
    expect(hasActiveApplicantFilterState({
      name: '',
      email: '',
      phone: '',
      location: '',
      skills: new Set(),
      selectedPositionIds: new Set(),
      selectedStatuses: new Set(),
      selectedRecruiterIds: new Set(),
      selectedSourceIds: new Set(),
      experienceYearsRange: [0, 0],
      customFieldFilters: {},
      advancedQueryInput: '',
    })).toBe(false);

    expect(hasActiveApplicantFilterState({
      name: '',
      email: '',
      phone: '',
      location: '',
      skills: new Set(['React']),
      selectedPositionIds: new Set(),
      selectedStatuses: new Set(),
      selectedRecruiterIds: new Set(),
      selectedSourceIds: new Set(),
      experienceYearsRange: [0, 0],
      customFieldFilters: {},
      advancedQueryInput: '',
    })).toBe(true);
  });

  it('parses comma-separated skill tokens', () => {
    expect(parseApplicantSkillTokens('React, Python, ,AWS')).toEqual(['React', 'Python', 'AWS']);
    expect(Array.from(createApplicantSkillsSet('React,Python'))).toEqual(['React', 'Python']);
    expect(Array.from(createApplicantSkillsSet())).toEqual([]);
  });

  it('updates advanced query history without duplicates', () => {
    expect(addApplicantQueryToHistory(['old', 'status:hired'], 'status:hired')).toEqual(['status:hired', 'old']);
    expect(addApplicantQueryToHistory(['a'], '  ')).toEqual(['a']);
    expect(addApplicantQueryToHistory(['1', '2', '3'], '4', 3)).toEqual(['4', '1', '2']);
  });

  it('normalizes AI search input and query history UI state', () => {
    expect(getTrimmedApplicantAiSearchQuery('  senior recruiter  ')).toBe('senior recruiter');
    expect(getTrimmedApplicantAiSearchQuery('   ')).toBeNull();

    const history = ['first', 'second', 'third'];
    expect(removeApplicantQueryHistoryItem(history, 1)).toEqual(['first', 'third']);
    expect(history).toEqual(['first', 'second', 'third']);
    expect(removeApplicantQueryHistoryItem(history, -1)).toEqual(['first', 'second', 'third']);

    expect(toggleApplicantQueryHistoryVisibility(false)).toBe(true);
    expect(toggleApplicantQueryHistoryVisibility(true)).toBe(false);
  });

  it('normalizes advanced query filters before applying them', () => {
    const from = new Date('2024-01-01T00:00:00.000Z');
    const to = new Date('2024-01-31T00:00:00.000Z');

    expect(createAdvancedApplicantFiltersPayload({
      name: 'Jane',
      location: 'Bangkok',
      locationOperator: 'is',
      applicationDateStart: from,
      applicationDateEnd: to,
      aiSearchQuery: 'stale ai query',
    })).toEqual({
      name: 'Jane',
      location: 'Bangkok',
      locationOperator: 'is',
      applicationDateStart: from,
      applicationDateEnd: to,
      aiSearchQuery: undefined,
    });
  });

  it('detects URL-provided applicant filters', () => {
    expect(hasApplicantUrlFilterValues({})).toBe(false);
    expect(hasApplicantUrlFilterValues({ selectedRecruiterIds: ['recruiter-1'] })).toBe(true);
    expect(hasApplicantUrlFilterValues({ locationOperator: 'is' })).toBe(true);
  });

  it('creates the cleared applicant filter payload used by reset', () => {
    expect(createClearedApplicantFiltersPayload()).toMatchObject({
      name: '',
      email: '',
      phone: '',
      skills: '',
      location: '',
      includeNoScoreInApplied: false,
      includeNoScoreInMatching: false,
      nameOperator: 'contains',
      aiSearchType: 'hybrid',
      aiSearchFilters: {},
    });
  });

  it('adds and removes applicant skills immutably', () => {
    const original = new Set(['React']);
    const added = addApplicantSkill(original, 'Python');
    expect(Array.from(added.skills)).toEqual(['React', 'Python']);
    expect(added.changed).toBe(true);
    expect(original.has('Python')).toBe(false);

    expect(addApplicantSkill(original, 'React').changed).toBe(false);

    const removed = removeApplicantSkill(added.skills, 'React');
    expect(Array.from(removed.skills)).toEqual(['Python']);
    expect(removed.changed).toBe(true);
  });

  it('removes the last applicant skill', () => {
    const removed = removeLastApplicantSkill(new Set(['React', 'Python']));
    expect(Array.from(removed.skills)).toEqual(['React']);
    expect(removed.changed).toBe(true);

    expect(removeLastApplicantSkill(new Set()).changed).toBe(false);
  });

  it('merges pasted applicant skills once from the current set', () => {
    const merged = mergeApplicantSkillsFromText(new Set(['React']), 'Python, AWS, React');
    expect(Array.from(merged.skills)).toEqual(['React', 'Python', 'AWS']);
    expect(merged.changed).toBe(true);

    expect(mergeApplicantSkillsFromText(new Set(['React']), 'React').changed).toBe(false);
  });
});
