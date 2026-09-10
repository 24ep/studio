import {
  USER_ROLE_FILTERS,
  type UsersPageFilters,
  type UsersPageFilterState,
  type UsersPageRoleFilter,
} from './users-page-types';

interface UsersQueryOptions {
  page?: number;
  pageSize?: number;
  idsOnly?: boolean;
}

type QueryParamValue = string | number | boolean | null | undefined;

function appendQueryParam(
  queryParams: URLSearchParams,
  key: string,
  value: QueryParamValue
) {
  if (value === null || value === undefined || value === false || value === '') {
    return;
  }

  queryParams.append(key, String(value));
}

export function buildUsersQueryParams(
  filters: UsersPageFilters = {},
  options: UsersQueryOptions = {}
) {
  const queryParams = new URLSearchParams();
  const params: Array<[string, QueryParamValue]> = [
    ['name', filters.name],
    ['email', filters.email],
    ['role', filters.role === 'ALL_ROLES' ? undefined : filters.role],
    ['teamId', filters.teamId === 'ALL_TEAMS' ? undefined : filters.teamId],
    ['idsOnly', options.idsOnly ? 'true' : undefined],
    ['page', options.page],
    ['pageSize', options.pageSize],
  ];

  params.forEach(([key, value]) => appendQueryParam(queryParams, key, value));
  return queryParams;
}

export function getUserPageFilterPayload({
  name,
  email,
  role,
  teamId,
}: {
  name: string;
  email: string;
  role: UsersPageRoleFilter;
  teamId: string | 'ALL_TEAMS';
}): UsersPageFilters {
  return { name, email, role, teamId };
}

export function normalizeUsersPageRoleFilter(value: string): UsersPageRoleFilter {
  return USER_ROLE_FILTERS.includes(value as UsersPageRoleFilter)
    ? value as UsersPageRoleFilter
    : 'ALL_ROLES';
}

export function buildCurrentUsersFilterPayload({
  nameFilter,
  emailFilter,
  roleFilter,
  teamFilter,
}: UsersPageFilterState): UsersPageFilters {
  return getUserPageFilterPayload({
    name: nameFilter,
    email: emailFilter,
    role: roleFilter,
    teamId: teamFilter,
  });
}
