import type { ApplicantCustomFieldFilterValue, ApplicantFilterValues } from '../../lib/types';
import type {
  ApplicantFilterAutoApplyDecision,
  ApplicantFilterAutoApplyDecisionInput,
  ApplicantPositionFilterApplyDecision,
  ApplicantPositionFilterApplyDecisionInput,
  ApplicantStandardFilterApplyDecision,
  ApplicantStandardFilterApplyDecisionInput,
  BuildStandardApplicantFiltersOptions,
  StandardApplicantFilterInput,
} from './applicant-filter-query-types';

export function cleanApplicantCustomFieldFilters(
  customFieldFilters: Record<string, ApplicantCustomFieldFilterValue>
) {
  const filteredCustomFields: Record<string, Exclude<ApplicantCustomFieldFilterValue, null | undefined | ''>> = {};

  for (const [fieldCode, value] of Object.entries(customFieldFilters)) {
    if (isFilledCustomFieldValue(value)) {
      filteredCustomFields[fieldCode] = value as Exclude<ApplicantCustomFieldFilterValue, null | undefined | ''>;
    }
  }

  return Object.keys(filteredCustomFields).length > 0 ? filteredCustomFields : undefined;
}

function isFilledCustomFieldValue(value: ApplicantCustomFieldFilterValue) {
  return value !== undefined && value !== null && (value === false || value !== '');
}

export function hasEmptyApplicantTextFilters({
  name,
  email,
  phone,
  location,
}: Pick<StandardApplicantFilterInput, 'name' | 'email' | 'phone' | 'location'>) {
  return name === '' || email === '' || phone === '' || location === '';
}

export function getApplicantStandardFilterApplyDecision({
  filters,
  lastAppliedFiltersKey,
  hasEmptyTextFilters,
}: ApplicantStandardFilterApplyDecisionInput): ApplicantStandardFilterApplyDecision {
  const filtersKey = JSON.stringify(filters);

  if (lastAppliedFiltersKey === filtersKey) {
    return {
      type: 'skip',
      nextLastAppliedFiltersKey: lastAppliedFiltersKey,
      filters: null,
    };
  }

  const shouldApplyFilterPayload = Object.keys(filters).length > 0 || hasEmptyTextFilters;

  return {
    type: 'apply',
    nextLastAppliedFiltersKey: shouldApplyFilterPayload ? filtersKey : lastAppliedFiltersKey,
    filters: shouldApplyFilterPayload ? filters : {},
  };
}

export function getApplicantFilterAutoApplyDecision({
  isInitialLoad,
  isSyncingFromInitialFilters,
  isComponentInitialized,
  isHandlingPositionChange,
  isApplyingFilters,
  advancedQueryInput,
  autoApply,
  delayMs = 100,
}: ApplicantFilterAutoApplyDecisionInput): ApplicantFilterAutoApplyDecision {
  const hasBlockingState = [
    isInitialLoad,
    isSyncingFromInitialFilters,
    !isComponentInitialized,
    isHandlingPositionChange,
    isApplyingFilters,
    Boolean(advancedQueryInput.trim()),
    !autoApply,
  ].some(Boolean);

  if (hasBlockingState) {
    return { type: 'skip' };
  }

  return { type: 'schedule', delayMs };
}

export function getApplicantPositionFilterApplyDecision({
  now,
  lastPositionChangeTime,
  filters,
  lastAppliedFiltersKey,
  throttleMs = 200,
}: ApplicantPositionFilterApplyDecisionInput): ApplicantPositionFilterApplyDecision {
  if (now - lastPositionChangeTime < throttleMs) {
    return {
      type: 'skip-throttle',
      nextLastPositionChangeTime: lastPositionChangeTime,
      nextLastAppliedFiltersKey: lastAppliedFiltersKey,
      filters: null,
    };
  }

  const filtersKey = JSON.stringify(filters);
  if (lastAppliedFiltersKey === filtersKey) {
    return {
      type: 'skip-duplicate',
      nextLastPositionChangeTime: now,
      nextLastAppliedFiltersKey: lastAppliedFiltersKey,
      filters: null,
    };
  }

  return {
    type: 'apply',
    nextLastPositionChangeTime: now,
    nextLastAppliedFiltersKey: filtersKey,
    filters,
  };
}

export function buildStandardApplicantFilters(
  {
    name,
    email,
    phone,
    nameOperator,
    emailOperator,
    phoneOperator,
    selectedPositionIds,
    selectedStatuses,
    selectedSourceIds,
    skills,
    location,
    locationOperator,
    experienceYearsRange,
    applicationDateRange,
    selectedRecruiterIds,
    customFieldFilters,
  }: StandardApplicantFilterInput,
  options: BuildStandardApplicantFiltersOptions = {}
) {
  const preserveEmptyTextFilters = options.preserveEmptyTextFilters ?? true;

  return compactApplicantFilters({
    ...buildTextFilterPair('name', name, nameOperator, preserveEmptyTextFilters),
    ...buildTextFilterPair('email', email, emailOperator, preserveEmptyTextFilters),
    ...buildTextFilterPair('phone', phone, phoneOperator, preserveEmptyTextFilters),
    selectedPositionIds: setToArrayOrUndefined(selectedPositionIds),
    selectedStatuses: setToArrayOrUndefined(selectedStatuses),
    selectedSourceIds: setToArrayOrUndefined(selectedSourceIds),
    skills: buildSkillsFilterValue(skills),
    ...buildTextFilterPair('location', location, locationOperator, preserveEmptyTextFilters),
    ...buildExperienceYearFilters(experienceYearsRange),
    applicationDateStart: applicationDateRange?.from,
    applicationDateEnd: applicationDateRange?.to,
    selectedRecruiterIds: setToArrayOrUndefined(selectedRecruiterIds),
    customFieldFilters: cleanApplicantCustomFieldFilters(customFieldFilters),
    aiSearchQuery: undefined,
  });
}

function buildTextFilterPair<
  TValueKey extends 'name' | 'email' | 'phone' | 'location',
  TOperatorKey extends `${TValueKey}Operator`,
>(
  valueKey: TValueKey,
  value: string,
  operator: ApplicantFilterValues[TOperatorKey],
  preserveEmptyTextFilters: boolean
) {
  const operatorKey = `${valueKey}Operator` as TOperatorKey;

  return {
    [valueKey]: buildTextFilterValue(value, preserveEmptyTextFilters),
    [operatorKey]: value ? operator : undefined,
  } as Pick<ApplicantFilterValues, TValueKey | TOperatorKey>;
}

function setToArrayOrUndefined<T>(values: Set<T>) {
  return values.size > 0 ? Array.from(values) : undefined;
}

function buildSkillsFilterValue(skills: Set<string>) {
  return skills.size > 0 ? Array.from(skills).join(',') : undefined;
}

function buildExperienceYearFilters(experienceYearsRange: [number, number]) {
  return {
    minExperienceYears: experienceYearsRange[0] > 0 ? experienceYearsRange[0] : undefined,
    maxExperienceYears: experienceYearsRange[1] < 50 ? experienceYearsRange[1] : undefined,
  };
}

function compactApplicantFilters(filters: ApplicantFilterValues) {
  const compacted: ApplicantFilterValues = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      compacted[key as keyof ApplicantFilterValues] = value as never;
    }
  }

  return compacted;
}

function buildTextFilterValue(value: string, preserveEmptyTextFilters: boolean) {
  if (preserveEmptyTextFilters) {
    return value !== undefined ? value : undefined;
  }

  return value || undefined;
}
