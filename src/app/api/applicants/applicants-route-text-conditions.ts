import type {
  ApplicantRouteMultiIdCondition,
  ApplicantRouteTextCondition,
} from './applicants-route-query-types';

export function buildApplicantRouteTextCondition(
  column: string,
  value: string | undefined | null,
  operator: string | undefined | null,
  paramIndex: number
): ApplicantRouteTextCondition | null {
  if (!value) {
    return null;
  }

  const sqlOperator = operator === 'is' ? '=' : 'ILIKE';
  let queryValue = value;

  if (sqlOperator === 'ILIKE') {
    if (operator === 'startsWith') {
      queryValue = `${value}%`;
    } else if (operator === 'endsWith') {
      queryValue = `%${value}`;
    } else {
      queryValue = `%${value}%`;
    }
  }

  return {
    clause: `${column} ${sqlOperator} $${paramIndex}`,
    value: queryValue,
    nextParamIndex: paramIndex + 1,
  };
}

export function buildApplicantRouteNullableMultiIdCondition({
  column,
  rawValue,
  nullToken,
  paramIndex,
  selectAllToken,
}: {
  column: string;
  rawValue: string | undefined | null;
  nullToken: string;
  paramIndex: number;
  selectAllToken?: string;
}): ApplicantRouteMultiIdCondition | null {
  if (!rawValue) {
    return null;
  }

  const ids = rawValue.split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0 || (selectAllToken && ids.includes(selectAllToken))) {
    return null;
  }

  const hasNullToken = ids.includes(nullToken);
  const regularIds = ids.filter((id) => id !== nullToken);

  if (hasNullToken && regularIds.length === 0) {
    return {
      clause: `${column} IS NULL`,
      params: [],
      nextParamIndex: paramIndex,
    };
  }

  if (regularIds.length === 1) {
    const equalityClause = `${column} = $${paramIndex}`;
    return {
      clause: hasNullToken
        ? `(${equalityClause} OR ${column} IS NULL)`
        : equalityClause,
      params: [regularIds[0]],
      nextParamIndex: paramIndex + 1,
    };
  }

  if (regularIds.length > 1) {
    const anyClause = `${column} = ANY($${paramIndex}::uuid[])`;
    return {
      clause: hasNullToken
        ? `(${anyClause} OR ${column} IS NULL)`
        : anyClause,
      params: [regularIds],
      nextParamIndex: paramIndex + 1,
    };
  }

  return null;
}
