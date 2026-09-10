import type {
  ApplicantRouteFilters,
  ApplicantRouteSqlCondition,
} from './applicants-route-query-types';

function normalizeRouteScoreFilterValue(value: number) {
  return value > 1 ? value / 100 : value;
}

export function buildApplicantRouteAppliedFitScoreConditions(
  filters: Pick<ApplicantRouteFilters, 'minAppliedJobFitScore' | 'maxAppliedJobFitScore' | 'includeNoScoreInApplied'>,
  paramIndex: number
): ApplicantRouteSqlCondition {
  const hasMin = filters.minAppliedJobFitScore !== undefined;
  const hasMax = filters.maxAppliedJobFitScore !== undefined;
  if (!hasMin && !hasMax) {
    return { clauses: [], params: [], nextParamIndex: paramIndex };
  }

  const noScoreCondition = `(c."fitScore" IS NULL OR c."fitScore" = 0)`;
  if (filters.minAppliedJobFitScore === -1 && filters.maxAppliedJobFitScore === -1) {
    return { clauses: [noScoreCondition], params: [], nextParamIndex: paramIndex };
  }

  const regularScoreConditions: string[] = [];
  const params: unknown[] = [];
  let nextParamIndex = paramIndex;

  if (hasMin && filters.minAppliedJobFitScore !== -1) {
    regularScoreConditions.push(`c."fitScore" >= $${nextParamIndex++}`);
    params.push(normalizeRouteScoreFilterValue(filters.minAppliedJobFitScore!));
  }

  if (hasMax && filters.maxAppliedJobFitScore !== -1) {
    regularScoreConditions.push(`c."fitScore" <= $${nextParamIndex++}`);
    params.push(normalizeRouteScoreFilterValue(filters.maxAppliedJobFitScore!));
  }

  if (filters.includeNoScoreInApplied) {
    if (regularScoreConditions.length === 0) {
      return { clauses: [noScoreCondition], params, nextParamIndex };
    }

    const regularClause = `(${regularScoreConditions.join(' AND ')})`;
    return {
      clauses: [`(${regularClause} OR ${noScoreCondition})`],
      params,
      nextParamIndex,
    };
  }

  return {
    clauses: regularScoreConditions,
    params,
    nextParamIndex,
  };
}

const NO_MATCHING_JOB_SCORE_CONDITION = `(
          (c."parsedData"->>'job_matches' IS NULL OR c."parsedData"->>'job_matches' = '[]' OR c."parsedData"->>'job_matches' = '')
          AND NOT EXISTS (SELECT 1 FROM "JobMatch" jm WHERE jm."applicant_id" = c.id)
        )`;

function buildMatchingJobFitScoreCondition(operator: '>=' | '<=', paramIndex: number) {
  return `(
            EXISTS (
              SELECT 1 FROM jsonb_array_elements(c."parsedData"->'job_matches') AS job_match
              WHERE CAST(job_match->>'fitScore' AS DECIMAL) ${operator} $${paramIndex}
            )
            OR EXISTS (
              SELECT 1 FROM "JobMatch" jm 
              WHERE jm."applicant_id" = c.id AND jm."fitScore" ${operator} $${paramIndex + 1}
            )
          )`;
}

export function buildApplicantRouteMatchingFitScoreConditions(
  filters: Pick<ApplicantRouteFilters, 'minMatchingJobFitScore' | 'maxMatchingJobFitScore' | 'includeNoScoreInMatching'>,
  paramIndex: number
): ApplicantRouteSqlCondition {
  const hasMin = filters.minMatchingJobFitScore !== undefined;
  const hasMax = filters.maxMatchingJobFitScore !== undefined;
  if (!hasMin && !hasMax) {
    return { clauses: [], params: [], nextParamIndex: paramIndex };
  }

  if (filters.minMatchingJobFitScore === -1 && filters.maxMatchingJobFitScore === -1) {
    return {
      clauses: [NO_MATCHING_JOB_SCORE_CONDITION],
      params: [],
      nextParamIndex: paramIndex,
    };
  }

  const regularScoreConditions: string[] = [];
  const params: unknown[] = [];
  let nextParamIndex = paramIndex;

  if (hasMin && filters.minMatchingJobFitScore !== -1) {
    const filterValue = normalizeRouteScoreFilterValue(filters.minMatchingJobFitScore!);
    regularScoreConditions.push(buildMatchingJobFitScoreCondition('>=', nextParamIndex));
    params.push(filterValue, filterValue);
    nextParamIndex += 2;
  }

  if (hasMax && filters.maxMatchingJobFitScore !== -1) {
    const filterValue = normalizeRouteScoreFilterValue(filters.maxMatchingJobFitScore!);
    regularScoreConditions.push(buildMatchingJobFitScoreCondition('<=', nextParamIndex));
    params.push(filterValue, filterValue);
    nextParamIndex += 2;
  }

  if (regularScoreConditions.length === 0) {
    return {
      clauses: filters.includeNoScoreInMatching ? [NO_MATCHING_JOB_SCORE_CONDITION] : [],
      params,
      nextParamIndex,
    };
  }

  return {
    clauses: [
      filters.includeNoScoreInMatching
        ? `((${regularScoreConditions.join(' AND ')}) OR ${NO_MATCHING_JOB_SCORE_CONDITION})`
        : `(${regularScoreConditions.join(' AND ')})`,
    ],
    params,
    nextParamIndex,
  };
}
