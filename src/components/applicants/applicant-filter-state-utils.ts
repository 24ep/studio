import type { ApplicantFilterCoreStateInput, ApplicantFilterStateSignalInput, StandardApplicantFilterInput } from './applicant-filter-query-types';

export function buildApplicantCurrentFilterSyncState(input: ApplicantFilterCoreStateInput) {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    selectedPositionIds: input.selectedPositionIds,
    selectedStatuses: input.selectedStatuses,
    selectedSourceIds: input.selectedSourceIds,
    skills: input.skills,
    location: input.location,
    locationOperator: input.locationOperator,
    experienceYearsRange: input.experienceYearsRange,
    applicationDateRange: input.applicationDateRange,
    selectedRecruiterIds: input.selectedRecruiterIds,
    customFieldFilters: input.customFieldFilters,
  };
}

export function buildApplicantFilterStateSignal(input: ApplicantFilterStateSignalInput) {
  return {
    name: input.name,
    nameOperator: input.nameOperator,
    email: input.email,
    emailOperator: input.emailOperator,
    phone: input.phone,
    phoneOperator: input.phoneOperator,
    location: input.location,
    locationOperator: input.locationOperator,
    selectedPositionIds: input.selectedPositionIds,
    selectedStatuses: input.selectedStatuses,
    selectedRecruiterIds: input.selectedRecruiterIds,
    selectedSourceIds: input.selectedSourceIds,
    skills: input.skills,
    experienceYearsRange: input.experienceYearsRange,
    applicationDateRange: input.applicationDateRange,
    customFieldFilters: input.customFieldFilters,
  };
}

export function getTrimmedApplicantAiSearchQuery(query: string): string | null {
  const trimmedQuery = query.trim();
  return trimmedQuery || null;
}

export function removeApplicantQueryHistoryItem(history: readonly string[], index: number): string[] {
  return history.filter((_, itemIndex) => itemIndex !== index);
}

export function toggleApplicantQueryHistoryVisibility(current: boolean): boolean {
  return !current;
}

export function hasActiveApplicantFilterState({
  name,
  email,
  phone,
  location,
  skills,
  selectedPositionIds,
  selectedStatuses,
  selectedRecruiterIds,
  selectedSourceIds,
  experienceYearsRange,
  applicationDateRange,
  customFieldFilters,
  advancedQueryInput,
}: Pick<StandardApplicantFilterInput,
  | 'name'
  | 'email'
  | 'phone'
  | 'location'
  | 'skills'
  | 'selectedPositionIds'
  | 'selectedStatuses'
  | 'selectedRecruiterIds'
  | 'selectedSourceIds'
  | 'experienceYearsRange'
  | 'applicationDateRange'
  | 'customFieldFilters'
> & { advancedQueryInput: string }) {
  return !!(
    name ||
    email ||
    phone ||
    location ||
    skills.size > 0 ||
    selectedPositionIds.size > 0 ||
    selectedStatuses.size > 0 ||
    selectedRecruiterIds.size > 0 ||
    selectedSourceIds.size > 0 ||
    experienceYearsRange[0] > 0 ||
    experienceYearsRange[1] > 0 ||
    applicationDateRange?.from ||
    applicationDateRange?.to ||
    Object.keys(customFieldFilters).length > 0 ||
    advancedQueryInput.trim()
  );
}
