import {
  buildApplicantRouteAppliedFitScoreConditions,
  buildApplicantRouteMatchingFitScoreConditions,
  buildApplicantRouteNullableMultiIdCondition,
  buildApplicantRouteTextCondition,
} from './applicants-route-utils';
import { appendCondition, appendSqlConditionResult } from './applicants-route-list-where-state';
import type { ApplicantRouteFilters } from './applicants-route-query-types';
import type { ApplicantRouteWhereState } from './applicants-route-list-where-types';

export function appendTextFilters(state: ApplicantRouteWhereState, filters: ApplicantRouteFilters) {
  const textFilterSpecs = [
    { column: 'c.name', value: filters.name, operator: filters.nameOperator },
    { column: 'c.email', value: filters.email, operator: filters.emailOperator },
    { column: 'c.phone', value: filters.phone, operator: filters.phoneOperator },
    { column: 'c.location', value: filters.location, operator: filters.locationOperator },
  ];

  for (const spec of textFilterSpecs) {
    const condition = buildApplicantRouteTextCondition(
      spec.column,
      spec.value,
      spec.operator,
      state.paramIndex
    );
    if (!condition) continue;

    appendCondition(state, condition.clause, [condition.value], condition.nextParamIndex);
  }
}

export function appendPositionFilter(state: ApplicantRouteWhereState, filters: ApplicantRouteFilters) {
  appendNullableMultiIdCondition(state, buildApplicantRouteNullableMultiIdCondition({
    column: 'c."positionId"',
    rawValue: filters.positionId,
    nullToken: 'not-applied',
    paramIndex: state.paramIndex,
  }));
}

export function appendSourceFilter(state: ApplicantRouteWhereState, filters: ApplicantRouteFilters) {
  appendNullableMultiIdCondition(state, buildApplicantRouteNullableMultiIdCondition({
    column: 'c."sourceId"',
    rawValue: filters.sourceId,
    nullToken: 'unassigned',
    selectAllToken: 'select-all',
    paramIndex: state.paramIndex,
  }));
}

export function appendScoreFilters(state: ApplicantRouteWhereState, filters: ApplicantRouteFilters) {
  appendSqlConditionResult(
    state,
    buildApplicantRouteAppliedFitScoreConditions(filters, state.paramIndex)
  );
  appendSqlConditionResult(
    state,
    buildApplicantRouteMatchingFitScoreConditions(filters, state.paramIndex)
  );
}

export function appendExperienceFilters(state: ApplicantRouteWhereState, filters: ApplicantRouteFilters) {
  if (filters.minExperienceYears !== undefined) {
    if (filters.minExperienceYears === -1) {
      state.whereClauses.push(`(c."parsedData"->>'experience' IS NULL OR c."parsedData"->>'experience' = '[]' OR c."parsedData"->>'experience' = '')`);
    } else {
      appendCondition(state, `CAST(c."parsedData"->>'totalExperienceYears' AS DECIMAL) >= $${state.paramIndex++}`, [filters.minExperienceYears]);
    }
  }

  if (filters.maxExperienceYears !== undefined) {
    appendCondition(state, `CAST(c."parsedData"->>'totalExperienceYears' AS DECIMAL) <= $${state.paramIndex++}`, [filters.maxExperienceYears]);
  }
}

export function appendApplicationDateFilters(state: ApplicantRouteWhereState, filters: ApplicantRouteFilters) {
  if (filters.applicationDateStart) {
    appendCondition(state, `c."applicationDate" >= $${state.paramIndex++}`, [filters.applicationDateStart.toISOString()]);
  }

  if (filters.applicationDateEnd) {
    appendCondition(state, `c."applicationDate" <= $${state.paramIndex++}`, [filters.applicationDateEnd.toISOString()]);
  }
}

export function appendSkillsFilter(state: ApplicantRouteWhereState, skillsFilter?: string) {
  if (!skillsFilter) {
    return;
  }

  const skills = skillsFilter.split(',').map(skill => skill.trim().toLowerCase()).filter(Boolean);
  if (skills.length === 0) {
    return;
  }

  const skillsConditions = skills.map((_, index) =>
    `LOWER(c."parsedData"->>'skills') LIKE $${state.paramIndex + index}`
  ).join(' AND ');

  appendCondition(
    state,
    `(${skillsConditions})`,
    skills.map(skill => `%${skill}%`),
    state.paramIndex + skills.length
  );
}

function appendNullableMultiIdCondition(
  state: ApplicantRouteWhereState,
  condition: ReturnType<typeof buildApplicantRouteNullableMultiIdCondition>
) {
  if (!condition) {
    return;
  }

  appendCondition(state, condition.clause, condition.params, condition.nextParamIndex);
}
