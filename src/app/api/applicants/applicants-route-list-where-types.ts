import type { QueryResultRow } from 'pg';
import type { PlatformModuleId } from '@/lib/types';
import type { ApplicantRouteFilters } from './applicants-route-query-types';

export interface ApplicantRouteListQueryClient {
  query: (query: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
}

export interface ApplicantRouteListUser {
  id: string;
  role?: string;
}

export interface ApplicantRouteWhereInput {
  client: ApplicantRouteListQueryClient;
  filters: ApplicantRouteFilters;
  pinnedOnly: boolean;
  user: ApplicantRouteListUser;
  hasPermission: (user: ApplicantRouteListUser, permission: PlatformModuleId) => boolean;
  readSystemSetting: (key: string) => Promise<unknown>;
}

export interface ApplicantRouteWhereParts {
  whereClause: string;
  queryParams: unknown[];
  nextParamIndex: number;
}

export interface ApplicantRouteWhereState {
  whereClauses: string[];
  queryParams: unknown[];
  paramIndex: number;
}

export interface ApplicantRouteSqlConditionResult {
  clauses: string[];
  params: unknown[];
  nextParamIndex: number;
}
