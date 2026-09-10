export const MAX_APPLICANTS_PAGE_SIZE = 500;
export const DEFAULT_APPLICANTS_PAGE_SIZE = 100;
export const APPLICANTS_QUERY_TIMEOUT = 10000;

export type ApplicantRouteAdvancedFilters = Record<string, string | undefined>;
export type ApplicantRouteCustomFieldFilters = Record<string, string>;

export interface ApplicantRouteFilters {
  name?: string;
  nameOperator: string;
  email?: string;
  emailOperator: string;
  phone?: string;
  phoneOperator: string;
  positionId?: string;
  status?: string;
  education?: string | null;
  minAppliedJobFitScore?: number;
  maxAppliedJobFitScore?: number;
  minMatchingJobFitScore?: number;
  maxMatchingJobFitScore?: number;
  includeNoScoreInApplied: boolean;
  includeNoScoreInMatching: boolean;
  minExperienceYears?: number;
  maxExperienceYears?: number;
  applicationDateStart?: Date;
  applicationDateEnd?: Date;
  recruiterId?: string;
  sourceId?: string | null;
  location?: string;
  locationOperator: string;
  skills?: string;
  customFieldFilters: ApplicantRouteCustomFieldFilters;
}

export interface ApplicantRouteQueryOptions {
  isForCounts: boolean;
  page: number;
  limit: number;
  offset: number;
  sortClause: string;
  pinnedOnly: boolean;
  advancedQuery: string | null;
  advancedFilters: ApplicantRouteAdvancedFilters;
  customFieldFilters: ApplicantRouteCustomFieldFilters;
  filters: ApplicantRouteFilters;
}

export interface ApplicantRouteRow {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  fitScore?: number | null;
  expectedSalary?: unknown;
  status?: string | null;
  statusId?: string | null;
  applicationDate?: Date | string | null;
  updatedAt?: Date | string | null;
  positionId?: string | null;
  recruiterId?: string | null;
  sourceId?: string | null;
  parsedData?: unknown;
  avatarUrl?: string | null;
  isPinned?: boolean | null;
  pinnedAt?: Date | string | null;
  positionTitle?: string | null;
  recruiterName?: string | null;
  sourceName?: string | null;
  isBlacklisted?: boolean | null;
  isRead?: boolean | null;
}

export interface ApplicantRouteTextCondition {
  clause: string;
  value: string;
  nextParamIndex: number;
}

export interface ApplicantRouteMultiIdCondition {
  clause: string;
  params: Array<string | string[]>;
  nextParamIndex: number;
}

export interface ApplicantRouteSqlCondition {
  clauses: string[];
  params: unknown[];
  nextParamIndex: number;
}

export interface ApplicantRouteCustomFieldDefinition {
  field_code: string;
  field_type: string;
  options?: unknown;
}

export interface ApplicantRouteListResponseMetadata {
  filters: ApplicantRouteFilters;
  page: number;
  limit: number | 'count-only';
  total: number;
  responseTime: number;
}
