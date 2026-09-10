export type QueryParamValue = string | number | boolean | string[] | null;

export type PositionListFilters = {
  title: string | null;
  department: string | null;
  isOpen: string | null;
  positionLevel: string | null;
  gradeId: string | null;
  recruiterId: string | null;
  hiringManagerId: string | null;
  limit: number;
  offset: number;
  includeStats: boolean;
  includeapplicantStats: boolean;
  includeHeadcount: boolean;
  customFieldFilters: Record<string, string>;
};

export type PositionFilterConditions = {
  conditions: string[];
  queryParams: QueryParamValue[];
  paramIndex: number;
  hiringManagerJoinClause: string;
  interviewerJoinClause: string;
};

export type PositionListRow = Record<string, unknown> & {
  id: string;
  customAttributes?: Record<string, unknown> | null;
  totalHeadcount?: string | number | null;
  vacantHeadcount?: string | number | null;
  filledHeadcount?: string | number | null;
};

export type PositionListItem = PositionListRow & {
  custom_attributes: Record<string, unknown>;
  headcountData?: {
    total: number;
    vacant: number;
    filled: number;
  };
  applicantStats?: {
    totalApplied: number;
    appliedStatusCount: number;
    totalMatching: number;
  };
};

export type CountRow = {
  count: string | number;
};

export type PositionStatsRow = {
  total: string | number;
  open: string | number;
  closed: string | number;
};

export type AppliedApplicantStatsRow = {
  position_id: string;
  total_applied: string | number;
};

export type MatchingApplicantStatsRow = {
  position_id: string;
  total_matching: string | number;
};

export type PositionStatistics = {
  total: number;
  open: number;
  closed: number;
};

export type PositionListQuery = {
  dataQuery: string;
  countQuery: string;
  statsQuery: string;
  filterParams: QueryParamValue[];
  queryParams: QueryParamValue[];
  includeHeadcount: boolean;
  includeapplicantStats: boolean;
  includeStats: boolean;
};
