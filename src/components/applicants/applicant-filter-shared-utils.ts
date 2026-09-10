import { parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import type { ApplicantFilterValues } from '../../lib/types';

export type ApplicantLocationOperator = NonNullable<ApplicantFilterValues['locationOperator']>;

interface ApplicantFilterDateRangeInput {
  applicationDateStart?: Date | string;
  applicationDateEnd?: Date | string;
}

function parseFilterDate(value: ApplicantFilterDateRangeInput['applicationDateStart']) {
  if (!value) return undefined;
  return value instanceof Date ? value : parseISO(String(value));
}

export function parseApplicantFilterDateRange(filters: ApplicantFilterDateRangeInput): DateRange | undefined {
  const from = parseFilterDate(filters.applicationDateStart);
  const to = parseFilterDate(filters.applicationDateEnd);

  if (!from && !to) {
    return undefined;
  }

  return { from, to };
}

export function areStringSetsEqual(setA: Set<string>, setB: Set<string>) {
  if (setA.size !== setB.size) return false;

  for (const item of setA) {
    if (!setB.has(item)) return false;
  }

  return true;
}

export function toggleStringSetItem(items: Set<string>, item: string) {
  const nextItems = new Set(items);
  if (nextItems.has(item)) {
    nextItems.delete(item);
  } else {
    nextItems.add(item);
  }

  return nextItems;
}

export function addApplicantQueryToHistory(history: string[], query: string, maxHistory = 10) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return history;

  return [
    trimmedQuery,
    ...history.filter(historyQuery => historyQuery !== trimmedQuery),
  ].slice(0, maxHistory);
}

export function createAdvancedApplicantFiltersPayload(parsedFilters: ApplicantFilterValues): ApplicantFilterValues {
  return {
    ...parsedFilters,
    applicationDateStart: parsedFilters.applicationDateStart,
    applicationDateEnd: parsedFilters.applicationDateEnd,
    location: parsedFilters.location,
    locationOperator: parsedFilters.locationOperator,
    aiSearchQuery: undefined,
  };
}

export function hasApplicantUrlFilterValues(filters: ApplicantFilterValues) {
  return Boolean(
    (filters.selectedPositionIds && filters.selectedPositionIds.length > 0) ||
    (filters.selectedRecruiterIds && filters.selectedRecruiterIds.length > 0) ||
    (filters.selectedStatuses && filters.selectedStatuses.length > 0) ||
    filters.name ||
    filters.email ||
    filters.phone ||
    filters.skills ||
    filters.location ||
    filters.aiSearchQuery ||
    filters.locationOperator
  );
}

export function createClearedApplicantFiltersPayload(): ApplicantFilterValues {
  return {
    name: '',
    email: '',
    phone: '',
    education: '',
    skills: '',
    location: '',
    cvLanguage: '',
    jobSuitableCareer: '',
    jobSuitableLevel: '',
    jobSuitablePosition: '',
    minExperienceYears: undefined,
    maxExperienceYears: undefined,
    selectedPositionIds: undefined,
    selectedStatuses: undefined,
    selectedRecruiterIds: undefined,
    selectedSourceIds: undefined,
    minAppliedJobFitScore: undefined,
    maxAppliedJobFitScore: undefined,
    minMatchingJobFitScore: undefined,
    maxMatchingJobFitScore: undefined,
    includeNoScoreInApplied: false,
    includeNoScoreInMatching: false,
    applicationDateStart: undefined,
    applicationDateEnd: undefined,
    nameOperator: 'contains',
    emailOperator: 'contains',
    phoneOperator: 'contains',
    locationOperator: 'contains',
    aiSearchQuery: undefined,
    aiSearchType: 'hybrid',
    aiSearchFilters: {},
    customFieldFilters: undefined,
  };
}
