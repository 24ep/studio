export type PositionJobMatchesRouteContext = {
  params: Promise<{ id: string }>;
};

export type PositionJobMatchesPagination = {
  page: number;
  limit: number;
  offset: number;
};

export type PositionJobMatchesFilters = {
  hasJobMatch: boolean;
  notApplied: boolean;
  searchTerm: string;
  showPinSection: boolean;
};

export type PositionJobMatchesSort = {
  sortClause: string;
};

export type PositionJobMatchesRequestOptions = {
  pagination: PositionJobMatchesPagination;
  filters: PositionJobMatchesFilters;
  sort: PositionJobMatchesSort;
  searchParams: URLSearchParams;
};

export type PositionJobMatchesQuery = {
  applicantsQuery: string;
  countQuery: string;
  dataParams: unknown[];
  countParams: unknown[];
};

export type PositionJobMatchesQueryInput = {
  positionId: string;
  pagination: PositionJobMatchesPagination;
  filters: PositionJobMatchesFilters;
  sort: PositionJobMatchesSort;
};
