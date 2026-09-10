import type { ApplicantRouteSqlConditionResult, ApplicantRouteWhereState } from './applicants-route-list-where-types';

export function createApplicantRouteWhereState(): ApplicantRouteWhereState {
  return {
    whereClauses: [],
    queryParams: [],
    paramIndex: 1,
  };
}

export function appendCondition(
  state: ApplicantRouteWhereState,
  clause: string,
  params: unknown[] = [],
  nextParamIndex?: number
) {
  state.whereClauses.push(clause);
  state.queryParams.push(...params);
  state.paramIndex = nextParamIndex ?? state.paramIndex;
}

export function appendSqlConditionResult(
  state: ApplicantRouteWhereState,
  condition: ApplicantRouteSqlConditionResult
) {
  state.whereClauses.push(...condition.clauses);
  state.queryParams.push(...condition.params);
  state.paramIndex = condition.nextParamIndex;
}

export function buildApplicantRouteWherePartsFromState(state: ApplicantRouteWhereState) {
  return {
    whereClause: state.whereClauses.length > 0
      ? `WHERE ${state.whereClauses.join(' AND ')}`
      : '',
    queryParams: state.queryParams,
    nextParamIndex: state.paramIndex,
  };
}
