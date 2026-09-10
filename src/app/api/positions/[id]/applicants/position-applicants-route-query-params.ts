import { type PositionApplicantsType } from './position-applicants-route-types';

const FIT_SCORE_SORT = 'COALESCE(("parsedData"->\'job_applied\'->>\'fitScore\')::numeric, "fitScore")';

const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  name: 'name',
  email: 'email',
  fitScore: FIT_SCORE_SORT,
  applicationDate: '"applicationDate"',
  status: 'status',
  lastUpdate: '"updatedAt"',
};

export function normalizePositionApplicantsType(type: string | null): PositionApplicantsType {
  if (type === 'matched' || type === 'all') {
    return type;
  }

  return 'applied';
}

export function buildPositionApplicantsSortClause(
  searchParams: URLSearchParams,
  type: PositionApplicantsType
): string {
  const sortColumnParam = searchParams.get('sortColumn') || 'fitScore';
  const sortDirectionParam = (searchParams.get('sortDirection') || 'desc').toLowerCase();
  const sortDirection = sortDirectionParam === 'asc' ? 'ASC' : 'DESC';
  let sortClause = `${ALLOWED_SORT_COLUMNS[sortColumnParam] || FIT_SCORE_SORT} ${sortDirection}`;

  if (sortColumnParam === 'fitScore') {
    sortClause = `${FIT_SCORE_SORT} ${sortDirection} ${sortDirection === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST'}`;
  }

  if (searchParams.get('showPinSection') === 'true') {
    sortClause = `__TABLE_ALIAS__."isPinned" DESC, __TABLE_ALIAS__."pinnedAt" DESC NULLS LAST, ${sortClause}`;
  }

  return sortClause.replace(/__TABLE_ALIAS__\./g, type === 'all' ? 'combined_results.' : 'c.');
}

export function addPositionApplicantsListFilter(
  clauses: string[],
  values: unknown[],
  column: string,
  rawValue: string | null,
  cast?: string
) {
  if (!rawValue) {
    return;
  }

  const items = rawValue.split(',').filter(Boolean);
  if (items.length === 0) {
    return;
  }

  const placeholders = items.map((_, index) => {
    const placeholder = `$${values.length + index + 4}`;
    return cast ? `${placeholder}::${cast}` : placeholder;
  });
  clauses.push(` AND ${column} IN (${placeholders.join(',')})`);
  values.push(...items);
}
