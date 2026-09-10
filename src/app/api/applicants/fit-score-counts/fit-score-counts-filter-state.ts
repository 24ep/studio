export type QueryClient = {
  query: (query: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

export type FitScoreCountsWhereClause = {
  whereClause: string;
  queryParams: unknown[];
};

export type FilterState = {
  whereClauses: string[];
  queryParams: unknown[];
  paramIndex: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createFilterState(): FilterState {
  return {
    whereClauses: [],
    queryParams: [],
    paramIndex: 1,
  };
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function splitFilterValues(raw: string | null) {
  return raw?.split(',').map(value => value.trim()).filter(Boolean) ?? [];
}

export function appendCondition(
  state: FilterState,
  clause: string,
  params: unknown[] = [],
  nextParamIndex?: number
) {
  state.whereClauses.push(clause);
  state.queryParams.push(...params);
  state.paramIndex = nextParamIndex ?? state.paramIndex;
}

export function toWhereClause(state: FilterState): FitScoreCountsWhereClause {
  return {
    whereClause: state.whereClauses.length > 0 ? `WHERE ${state.whereClauses.join(' AND ')}` : '',
    queryParams: state.queryParams,
  };
}
