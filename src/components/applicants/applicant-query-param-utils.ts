import type { ApplicantFilterValues } from '@/lib/types';

export type ApplicantFilterParamMap = ReadonlyArray<readonly [keyof ApplicantFilterValues, string]>;

type ApplicantTextFilterConfig = Readonly<{
  valueKey: 'name' | 'email' | 'phone';
  operatorKey: 'nameOperator' | 'emailOperator' | 'phoneOperator';
  queryKey: string;
  operatorQueryKey: string;
}>;

export const APPLICANT_TABLE_TEXT_FILTERS = [
  {
    valueKey: 'name',
    operatorKey: 'nameOperator',
    queryKey: 'name',
    operatorQueryKey: 'nameOperator',
  },
  {
    valueKey: 'email',
    operatorKey: 'emailOperator',
    queryKey: 'email',
    operatorQueryKey: 'emailOperator',
  },
  {
    valueKey: 'phone',
    operatorKey: 'phoneOperator',
    queryKey: 'phone',
    operatorQueryKey: 'phoneOperator',
  },
] satisfies ReadonlyArray<ApplicantTextFilterConfig>;

export function appendPresentApplicantParam(
  params: URLSearchParams,
  queryKey: string,
  value: unknown
) {
  if (value !== undefined && value !== null && value !== '') {
    params.append(queryKey, String(value));
  }
}

export function appendApplicantScalarParams(
  params: URLSearchParams,
  filters: ApplicantFilterValues,
  filterParams: ApplicantFilterParamMap
) {
  for (const [filterKey, queryKey] of filterParams) {
    appendPresentApplicantParam(params, queryKey, filters[filterKey]);
  }
}

export function appendApplicantArrayParams(
  params: URLSearchParams,
  filters: ApplicantFilterValues,
  filterParams: ApplicantFilterParamMap
) {
  for (const [filterKey, queryKey] of filterParams) {
    const value = filters[filterKey];
    if (Array.isArray(value) && value.length > 0) {
      params.append(queryKey, value.join(','));
    }
  }
}

export function getTrimmedApplicantAdvancedQuery(advancedQuery?: string | null) {
  return typeof advancedQuery === 'string' ? advancedQuery.trim() : '';
}

export function appendApplicantTextFilters(
  params: URLSearchParams,
  filters: ApplicantFilterValues,
  textFilters: ReadonlyArray<ApplicantTextFilterConfig> = APPLICANT_TABLE_TEXT_FILTERS
) {
  for (const { valueKey, operatorKey, queryKey, operatorQueryKey } of textFilters) {
    const value = filters[valueKey];
    if (value) {
      params.append(queryKey, value);
      appendPresentApplicantParam(params, operatorQueryKey, filters[operatorKey]);
    }
  }
}

export function appendApplicantExperienceParams(
  params: URLSearchParams,
  filters: ApplicantFilterValues
) {
  if (
    filters.minExperienceYears !== undefined &&
    (filters.minExperienceYears > 0 || filters.minExperienceYears === -1)
  ) {
    params.append('minExperienceYears', String(filters.minExperienceYears));
  }

  if (filters.maxExperienceYears !== undefined && filters.maxExperienceYears < 50) {
    params.append('maxExperienceYears', String(filters.maxExperienceYears));
  }
}

export function appendApplicantDateParams(
  params: URLSearchParams,
  filters: ApplicantFilterValues
) {
  if (filters.applicationDateStart) {
    params.append('applicationDateStart', filters.applicationDateStart.toISOString());
  }

  if (filters.applicationDateEnd) {
    params.append('applicationDateEnd', filters.applicationDateEnd.toISOString());
  }
}

export function appendApplicantCustomFieldParams(
  params: URLSearchParams,
  filters: ApplicantFilterValues
) {
  if (!filters.customFieldFilters || Object.keys(filters.customFieldFilters).length === 0) {
    return;
  }

  for (const [fieldCode, value] of Object.entries(filters.customFieldFilters)) {
    appendPresentApplicantParam(params, `customField_${fieldCode}`, value);
  }
}

export function appendApplicantScoreParams(
  params: URLSearchParams,
  filters: ApplicantFilterValues
) {
  appendPresentApplicantParam(params, 'minAppliedJobFitScore', filters.minAppliedJobFitScore);
  appendPresentApplicantParam(params, 'maxAppliedJobFitScore', filters.maxAppliedJobFitScore);
  appendPresentApplicantParam(params, 'minMatchingJobFitScore', filters.minMatchingJobFitScore);
  appendPresentApplicantParam(params, 'maxMatchingJobFitScore', filters.maxMatchingJobFitScore);

  if (filters.includeNoScoreInApplied) {
    params.append('includeNoScoreInApplied', 'true');
  }

  if (filters.includeNoScoreInMatching) {
    params.append('includeNoScoreInMatching', 'true');
  }
}

export function appendApplicantTablePagingParams(
  params: URLSearchParams,
  {
    page,
    pageSize,
    sortColumn,
    sortDirection,
    showPinSection,
  }: {
    page: number;
    pageSize: number;
    sortColumn?: string | null;
    sortDirection?: 'asc' | 'desc' | null;
    showPinSection: boolean;
  }
) {
  params.append('page', String(page));
  params.append('limit', String(pageSize));
  if (sortColumn) {
    params.append('sortColumn', sortColumn);
  }
  params.append('sortDirection', sortDirection || '');
  params.append('showPinSection', String(showPinSection));
}
