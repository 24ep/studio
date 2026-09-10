import type {
  ApplicantRouteCustomFieldDefinition,
  ApplicantRouteSqlCondition,
} from './applicants-route-query-types';

export function buildApplicantRouteCustomFieldConditions({
  customFieldFilters,
  customFieldDefinitions,
  paramIndex,
}: {
  customFieldFilters: Record<string, unknown>;
  customFieldDefinitions: Record<string, ApplicantRouteCustomFieldDefinition>;
  paramIndex: number;
}): ApplicantRouteSqlCondition {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let nextParamIndex = paramIndex;

  for (const [fieldCode, filterValue] of Object.entries(customFieldFilters)) {
    if (filterValue === undefined || filterValue === null || filterValue === '' || filterValue === 'null') {
      continue;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(fieldCode)) {
      console.warn(`[SECURITY] Invalid fieldCode format detected: ${fieldCode}`);
      continue;
    }

    const fieldDef = customFieldDefinitions[fieldCode];
    if (!fieldDef) continue;

    switch (fieldDef.field_type) {
      case 'text':
      case 'textarea':
        clauses.push(`c."customAttributes"->>$${nextParamIndex++} ILIKE $${nextParamIndex++}`);
        params.push(fieldCode, `%${filterValue}%`);
        break;

      case 'number': {
        const numValue = parseFloat(filterValue as string);
        if (!Number.isNaN(numValue)) {
          clauses.push(`CAST(c."customAttributes"->>$${nextParamIndex++} AS DECIMAL) = $${nextParamIndex++}`);
          params.push(fieldCode, numValue);
        }
        break;
      }

      case 'boolean': {
        const boolValue = filterValue === 'true';
        clauses.push(`CAST(c."customAttributes"->>$${nextParamIndex++} AS BOOLEAN) = $${nextParamIndex++}`);
        params.push(fieldCode, boolValue);
        break;
      }

      case 'date': {
        try {
          const dateValue = new Date(filterValue as string);
          clauses.push(`CAST(c."customAttributes"->>$${nextParamIndex++} AS DATE) = $${nextParamIndex++}`);
          params.push(fieldCode, dateValue.toISOString().split('T')[0]);
        } catch {
          // Invalid date, skip this filter.
        }
        break;
      }

      case 'select_single':
        clauses.push(`c."customAttributes"->>$${nextParamIndex++} = $${nextParamIndex++}`);
        params.push(fieldCode, filterValue);
        break;

      case 'select_multiple':
        if (Array.isArray(filterValue)) {
          const currentFieldCodeParamIndex = nextParamIndex;
          nextParamIndex++;
          params.push(fieldCode);

          const valueConditions = filterValue.map((_, idx) =>
            `c."customAttributes"->$${currentFieldCodeParamIndex} ? $${nextParamIndex + idx}`
          );

          clauses.push(`(${valueConditions.join(' OR ')})`);
          params.push(...filterValue);
          nextParamIndex += filterValue.length;
        } else {
          clauses.push(`c."customAttributes"->>$${nextParamIndex++} = $${nextParamIndex++}`);
          params.push(fieldCode, filterValue);
        }
        break;
    }
  }

  return { clauses, params, nextParamIndex };
}
