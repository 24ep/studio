import type { ApplicantFilterValues } from '@/lib/types';
import {
  appendApplicantArrayParams,
  appendApplicantCustomFieldParams,
  appendApplicantDateParams,
  appendApplicantExperienceParams,
  appendApplicantScalarParams,
  appendApplicantScoreParams,
  appendApplicantTablePagingParams,
  appendApplicantTextFilters,
  appendPresentApplicantParam,
  getTrimmedApplicantAdvancedQuery,
  type ApplicantFilterParamMap,
} from './applicant-query-param-utils';

type ApplicantExportFetch = (
  input: string,
  init?: RequestInit
) => Promise<Pick<Response, 'ok' | 'status' | 'blob' | 'text'>>;

const APPLICANT_EXPORT_ARRAY_FILTERS: ApplicantFilterParamMap = [
  ['selectedPositionIds', 'positionIds'],
  ['selectedStatuses', 'status'],
  ['selectedSourceIds', 'sourceIds'],
  ['selectedRecruiterIds', 'recruiterIds'],
];

const PINNED_APPLICANT_ARRAY_FILTERS: ApplicantFilterParamMap = [
  ['selectedPositionIds', 'positionId'],
  ['selectedStatuses', 'statusId'],
  ['selectedRecruiterIds', 'recruiterId'],
  ['selectedSourceIds', 'sourceId'],
];

const APPLICANT_EXPORT_SCALAR_FILTERS: ApplicantFilterParamMap = [
  ['name', 'name'],
  ['email', 'email'],
  ['phone', 'phone'],
  ['location', 'location'],
  ['skills', 'skills'],
  ['minExperienceYears', 'minExperienceYears'],
  ['maxExperienceYears', 'maxExperienceYears'],
  ['minAppliedJobFitScore', 'minAppliedJobFitScore'],
  ['maxAppliedJobFitScore', 'maxAppliedJobFitScore'],
  ['minMatchingJobFitScore', 'minMatchingJobFitScore'],
  ['maxMatchingJobFitScore', 'maxMatchingJobFitScore'],
  ['applicationDateStart', 'applicationDateStart'],
  ['applicationDateEnd', 'applicationDateEnd'],
];

const APPLICANT_TABLE_ARRAY_FILTERS: ApplicantFilterParamMap = [
  ['selectedPositionIds', 'positionId'],
  ['selectedStatuses', 'status'],
  ['selectedRecruiterIds', 'recruiterId'],
  ['selectedSourceIds', 'sourceId'],
];

export function buildApplicantExportQuery(filters: ApplicantFilterValues) {
  const params = new URLSearchParams();

  appendApplicantScalarParams(params, filters, APPLICANT_EXPORT_SCALAR_FILTERS);
  appendApplicantArrayParams(params, filters, APPLICANT_EXPORT_ARRAY_FILTERS);
  params.append('format', 'excel');
  return params;
}

export function buildApplicantTableQuery({
  filters,
  page,
  pageSize,
  sortColumn,
  sortDirection,
  advancedQuery,
  showPinSection,
}: {
  filters: ApplicantFilterValues;
  page: number;
  pageSize: number;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  advancedQuery?: string | null;
  showPinSection: boolean;
}) {
  const query = new URLSearchParams();
  const trimmedAdvancedQuery = getTrimmedApplicantAdvancedQuery(advancedQuery);
  const hasAdvancedQuery = trimmedAdvancedQuery.length > 0;

  if (hasAdvancedQuery) {
    query.append('query', trimmedAdvancedQuery);
  }

  if (!hasAdvancedQuery) {
    appendApplicantTextFilters(query, filters);
    appendApplicantArrayParams(query, filters, APPLICANT_TABLE_ARRAY_FILTERS.slice(0, 2));
    appendPresentApplicantParam(query, 'education', filters.education);
    appendApplicantExperienceParams(query, filters);
    appendApplicantDateParams(query, filters);
    appendApplicantArrayParams(query, filters, APPLICANT_TABLE_ARRAY_FILTERS.slice(2));
    appendApplicantCustomFieldParams(query, filters);
  }

  appendApplicantScoreParams(query, filters);
  appendApplicantTablePagingParams(query, {
    page,
    pageSize,
    sortColumn,
    sortDirection,
    showPinSection,
  });

  return query;
}

export function buildPinnedApplicantsQuery(filters: ApplicantFilterValues) {
  const params = new URLSearchParams();

  appendPresentApplicantParam(params, 'search', filters.aiSearchQuery);
  appendApplicantArrayParams(params, filters, PINNED_APPLICANT_ARRAY_FILTERS);

  params.append('pinnedOnly', 'true');
  params.append('limit', '1000');
  return params;
}

export function getApplicantExportErrorMessage(status: number) {
  if (status === 401) {
    return 'Authentication required. Please refresh the page and try again.';
  }

  if (status === 403) {
    return 'No permission';
  }

  if (status === 500) {
    return 'Server error. Please try again or contact support if the problem persists.';
  }

  if (status === 504) {
    return 'Request timed out. The export may be too large. Please try with fewer filters.';
  }

  return 'Export failed. Please try again.';
}

export async function fetchApplicantExportBlob(
  filters: ApplicantFilterValues,
  fetcher: ApplicantExportFetch = fetch
) {
  const params = buildApplicantExportQuery(filters);
  const response = await fetcher(`/api/applicants/export?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Export failed with status:', response.status, 'Error:', errorText);
    throw new Error(getApplicantExportErrorMessage(response.status));
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('Export returned empty file. Please check your filters and try again.');
  }

  return blob;
}
