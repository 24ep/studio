import type {
  ApplicantRouteAdvancedFilters,
  ApplicantRouteCustomFieldFilters,
} from './applicants-route-query-types';

export function parseNumberFilter(
  searchParams: URLSearchParams,
  key: string,
  advancedFilters: ApplicantRouteAdvancedFilters,
) {
  const directValue = searchParams.get(key);
  if (directValue) return parseFloat(directValue);

  const advancedValue = advancedFilters[key];
  return advancedValue ? parseFloat(advancedValue) : undefined;
}

export function parseIntegerFilter(
  searchParams: URLSearchParams,
  key: string,
  advancedFilters: ApplicantRouteAdvancedFilters,
) {
  const directValue = searchParams.get(key);
  if (directValue) return parseInt(directValue, 10);

  const advancedValue = advancedFilters[key];
  return advancedValue ? parseInt(advancedValue, 10) : undefined;
}

export function parseDateFilter(
  searchParams: URLSearchParams,
  key: string,
  advancedFilters: ApplicantRouteAdvancedFilters,
) {
  const directValue = searchParams.get(key);
  if (directValue) return new Date(directValue);

  const advancedValue = advancedFilters[key];
  return advancedValue ? new Date(advancedValue) : undefined;
}

export function getApplicantRouteCustomFieldFilters(searchParams: URLSearchParams) {
  const customFieldFilters: ApplicantRouteCustomFieldFilters = {};

  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('customField_')) {
      customFieldFilters[key.replace('customField_', '')] = value;
    }
  }

  return customFieldFilters;
}
