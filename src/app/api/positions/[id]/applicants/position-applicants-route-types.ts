export type PositionApplicantsRouteContext = {
  params: Promise<{ id: string }>;
};

export type PositionApplicantsType = 'applied' | 'matched' | 'all';

export interface PositionApplicantsQueryOptions {
  positionId: string;
  page: number;
  limit: number;
  offset: number;
  type: PositionApplicantsType;
  sortClause: string;
  searchTerm: string;
  searchPattern: string;
  filterClauses: string;
  filterValues: unknown[];
}
