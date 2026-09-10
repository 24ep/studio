import { getPool } from '@/lib/db';

type CustomFieldFilterValue = string | number | boolean | string[] | null | undefined;
type PositionQueryParam = string | number | boolean | string[] | null;

type PositionCustomFieldDefinitionRow = {
  field_code: string;
  field_type: string;
  options: unknown;
};

type PositionCustomFieldDefinitionMap = Record<string, PositionCustomFieldDefinitionRow>;

export async function addPositionCustomFieldFilters(
  customFieldFilters: Record<string, CustomFieldFilterValue>,
  conditions: string[],
  queryParams: PositionQueryParam[],
  paramIndex: number
) {
  if (Object.keys(customFieldFilters).length === 0) {
    return paramIndex;
  }

  const customFieldDefs = await getPositionCustomFieldDefinitions();

  for (const [fieldCode, filterValue] of Object.entries(customFieldFilters)) {
    if (!filterValue || filterValue === '' || filterValue === 'null') {
      continue;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(fieldCode)) {
      console.warn(`[SECURITY] Invalid fieldCode format detected: ${fieldCode}`);
      continue;
    }

    const fieldDef = customFieldDefs[fieldCode];
    if (!fieldDef) {
      continue;
    }

    paramIndex = addCustomFieldCondition(fieldDef.field_type, fieldCode, filterValue, conditions, queryParams, paramIndex);
  }

  return paramIndex;
}

async function getPositionCustomFieldDefinitions() {
  const customFieldDefsResult = await getPool().query<PositionCustomFieldDefinitionRow>(`
    SELECT field_code, field_type, options
    FROM "CustomFieldDefinition"
    WHERE model_name = 'Position' AND show_in_filter = true
  `);

  return customFieldDefsResult.rows.reduce<PositionCustomFieldDefinitionMap>((acc, row) => {
    acc[row.field_code] = row;
    return acc;
  }, {});
}

function addCustomFieldCondition(
  fieldType: string,
  fieldCode: string,
  filterValue: CustomFieldFilterValue,
  conditions: string[],
  queryParams: PositionQueryParam[],
  paramIndex: number
) {
  if (filterValue === null || filterValue === undefined) {
    return paramIndex;
  }

  switch (fieldType) {
    case 'text':
    case 'textarea':
      conditions.push(`p."customAttributes"->>$${paramIndex++} ILIKE $${paramIndex++}`);
      queryParams.push(fieldCode, `%${filterValue}%`);
      break;
    case 'number': {
      const numValue = parseFloat(String(filterValue));
      if (!isNaN(numValue)) {
        conditions.push(`CAST(p."customAttributes"->>$${paramIndex++} AS DECIMAL) = $${paramIndex++}`);
        queryParams.push(fieldCode, numValue);
      }
      break;
    }
    case 'boolean':
      conditions.push(`CAST(p."customAttributes"->>$${paramIndex++} AS BOOLEAN) = $${paramIndex++}`);
      queryParams.push(fieldCode, filterValue === 'true' || filterValue === true);
      break;
    case 'date':
      try {
        const dateValue = new Date(String(filterValue));
        conditions.push(`CAST(p."customAttributes"->>$${paramIndex++} AS DATE) = $${paramIndex++}`);
        queryParams.push(fieldCode, dateValue.toISOString().split('T')[0]);
      } catch {
        // Invalid date, skip this filter.
      }
      break;
    case 'select_single':
      conditions.push(`p."customAttributes"->>$${paramIndex++} = $${paramIndex++}`);
      queryParams.push(fieldCode, String(filterValue));
      break;
    case 'select_multiple':
      paramIndex = addMultiSelectCustomFieldCondition(fieldCode, filterValue, conditions, queryParams, paramIndex);
      break;
  }

  return paramIndex;
}

function addMultiSelectCustomFieldCondition(
  fieldCode: string,
  filterValue: CustomFieldFilterValue,
  conditions: string[],
  queryParams: PositionQueryParam[],
  paramIndex: number
) {
  if (filterValue === null || filterValue === undefined) {
    return paramIndex;
  }

  if (!Array.isArray(filterValue)) {
    conditions.push(`p."customAttributes"->>$${paramIndex++} = $${paramIndex++}`);
    queryParams.push(fieldCode, filterValue);
    return paramIndex;
  }

  const fieldCodeParamIndex = paramIndex++;
  const multiConditions = filterValue.map((_value, index) =>
    `p."customAttributes"->$${fieldCodeParamIndex} ? $${paramIndex + index}`
  );
  conditions.push(`(${multiConditions.join(' OR ')})`);
  queryParams.push(fieldCode, ...filterValue);
  return paramIndex + filterValue.length;
}
