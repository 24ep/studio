import { type NextRequest } from 'next/server';
import {
  type PositionApplicantsQueryOptions,
} from './position-applicants-route-types';
import {
  addPositionApplicantsListFilter,
  buildPositionApplicantsSortClause,
  normalizePositionApplicantsType,
} from './position-applicants-route-query-params';

export { buildPositionApplicantsQueries } from './position-applicants-route-sql';

export function parsePositionApplicantsQuery(
  request: NextRequest,
  positionId: string
): PositionApplicantsQueryOptions {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
  const type = normalizePositionApplicantsType(searchParams.get('type'));
  const filterClauses: string[] = [];
  const filterValues: unknown[] = [];

  addPositionApplicantsListFilter(filterClauses, filterValues, 'rs.name', searchParams.get('status'));
  addPositionApplicantsListFilter(filterClauses, filterValues, 'c."recruiterId"', searchParams.get('recruiterId'), 'uuid');
  addPositionApplicantsListFilter(filterClauses, filterValues, 'c."sourceId"', searchParams.get('sourceId'), 'uuid');

  const searchTerm = searchParams.get('searchTerm') || '';

  return {
    positionId,
    page,
    limit,
    offset: (page - 1) * limit,
    type,
    sortClause: buildPositionApplicantsSortClause(searchParams, type),
    searchTerm,
    searchPattern: `%${searchTerm}%`,
    filterClauses: filterClauses.join(''),
    filterValues,
  };
}
