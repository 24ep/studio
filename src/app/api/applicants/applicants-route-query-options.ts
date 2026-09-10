import { parseApplicantRouteAdvancedFilters } from './applicants-route-advanced-filters';
import {
  getApplicantRouteCustomFieldFilters,
  parseDateFilter,
  parseIntegerFilter,
  parseNumberFilter,
} from './applicants-route-query-parsers';
import {
  DEFAULT_APPLICANTS_PAGE_SIZE,
  MAX_APPLICANTS_PAGE_SIZE,
  type ApplicantRouteQueryOptions,
} from './applicants-route-query-types';
import { buildApplicantRouteSortClause } from './applicants-route-sort-options';

export {
  buildApplicantRouteSortClause,
  getApplicantRouteCustomFieldFilters,
  parseApplicantRouteAdvancedFilters,
};

export function parseApplicantRouteQueryOptions(searchParams: URLSearchParams): ApplicantRouteQueryOptions {
  const isForCounts = searchParams.get('forCounts') === 'true';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const requestedLimit = parseInt(searchParams.get('limit') || DEFAULT_APPLICANTS_PAGE_SIZE.toString(), 10);
  const limit = Math.max(1, Math.min(
    MAX_APPLICANTS_PAGE_SIZE,
    Number.isNaN(requestedLimit) ? DEFAULT_APPLICANTS_PAGE_SIZE : requestedLimit
  ));
  const offset = (page - 1) * limit;
  const advancedQuery = searchParams.get('query');
  const advancedFilters = parseApplicantRouteAdvancedFilters(advancedQuery);
  const customFieldFilters = getApplicantRouteCustomFieldFilters(searchParams);

  return {
    isForCounts,
    page,
    limit,
    offset,
    sortClause: buildApplicantRouteSortClause(searchParams),
    pinnedOnly: searchParams.get('pinnedOnly') === 'true',
    advancedQuery,
    advancedFilters,
    customFieldFilters,
    filters: {
      name: searchParams.get('name') || advancedFilters.searchTerm,
      nameOperator: searchParams.get('nameOperator') || 'contains',
      email: searchParams.get('email') || advancedFilters.email,
      emailOperator: searchParams.get('emailOperator') || 'contains',
      phone: searchParams.get('phone') || advancedFilters.phone,
      phoneOperator: searchParams.get('phoneOperator') || 'contains',
      positionId: searchParams.get('positionId') || advancedFilters.positionId,
      status: searchParams.get('status') || advancedFilters.status,
      education: searchParams.get('education'),
      minAppliedJobFitScore: parseNumberFilter(searchParams, 'minAppliedJobFitScore', advancedFilters),
      maxAppliedJobFitScore: parseNumberFilter(searchParams, 'maxAppliedJobFitScore', advancedFilters),
      minMatchingJobFitScore: parseNumberFilter(searchParams, 'minMatchingJobFitScore', advancedFilters),
      maxMatchingJobFitScore: parseNumberFilter(searchParams, 'maxMatchingJobFitScore', advancedFilters),
      includeNoScoreInApplied: advancedQuery && !searchParams.has('includeNoScoreInApplied') ? false : (searchParams.get('includeNoScoreInApplied') === 'true'),
      includeNoScoreInMatching: advancedQuery && !searchParams.has('includeNoScoreInMatching') ? false : (searchParams.get('includeNoScoreInMatching') === 'true'),
      minExperienceYears: parseIntegerFilter(searchParams, 'minExperienceYears', advancedFilters),
      maxExperienceYears: parseIntegerFilter(searchParams, 'maxExperienceYears', advancedFilters),
      applicationDateStart: parseDateFilter(searchParams, 'applicationDateStart', advancedFilters),
      applicationDateEnd: parseDateFilter(searchParams, 'applicationDateEnd', advancedFilters),
      recruiterId: searchParams.get('recruiterId') || advancedFilters.recruiterId,
      sourceId: searchParams.get('sourceId'),
      location: searchParams.get('location') || advancedFilters.location,
      locationOperator: searchParams.get('locationOperator') || 'contains',
      skills: searchParams.get('skills') || advancedFilters.skills,
      customFieldFilters,
    },
  };
}
