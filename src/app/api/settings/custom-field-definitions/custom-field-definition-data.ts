import { v4 as uuidv4 } from 'uuid';
import type { QueryResultRow } from 'pg';
import { getPool } from '@/lib/db';
import type {
  CreateCustomFieldInput,
  CustomFieldModelName,
  UpdateCustomFieldByIdInput,
  UpdateCustomFieldInput,
} from './custom-field-definition-schema';
import {
  CUSTOM_FIELD_SELECT_COLUMNS,
  buildCustomFieldCreateParams,
  buildCustomFieldUpdateByIdQuery,
  buildCustomFieldUpdateQuery as buildCustomFieldUpdateQueryObject,
  mapCustomFieldDefinitionRow,
  type CountRow,
  type CustomFieldDefinitionRow,
} from './custom-field-definition-query-utils';

export { mapCustomFieldDefinitionRow } from './custom-field-definition-query-utils';

export async function fetchCustomFieldDefinitions(modelName: CustomFieldModelName | null) {
  const queryParams: unknown[] = [];
  let query = `
    SELECT ${CUSTOM_FIELD_SELECT_COLUMNS}
    FROM "CustomFieldDefinition"
  `;

  if (modelName) {
    query += ' WHERE model_name = $1';
    queryParams.push(modelName);
  }

  query += ' ORDER BY sort_order ASC, label ASC';

  const result = await getPool().query<CustomFieldDefinitionRow>(query, queryParams);
  return result.rows.map(mapCustomFieldDefinitionRow);
}

export async function fetchCustomFieldDefinitionById(fieldId: string) {
  const result = await getPool().query<CustomFieldDefinitionRow>(
    `
      SELECT ${CUSTOM_FIELD_SELECT_COLUMNS}
      FROM "CustomFieldDefinition"
      WHERE id = $1
    `,
    [fieldId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    raw: result.rows[0],
    mapped: mapCustomFieldDefinitionRow(result.rows[0]),
  };
}

export async function customFieldExists(modelName: CustomFieldModelName, fieldCode: string) {
  const result = await getPool().query<QueryResultRow>(
    'SELECT id FROM "CustomFieldDefinition" WHERE model_name = $1 AND field_code = $2',
    [modelName, fieldCode]
  );

  return result.rows.length > 0;
}

export async function createCustomFieldDefinition(input: CreateCustomFieldInput) {
  const newFieldId = uuidv4();

  const result = await getPool().query<CustomFieldDefinitionRow>(
    `
      INSERT INTO "CustomFieldDefinition" (
        id, model_name, field_key, field_code, label, field_type, options,
        is_required, sort_order, attribute_code, attribute_label,
        view_roles, edit_roles, show_in_filter, show_in_applicant_detail,
        show_in_full_applicant_detail, show_in_task_board_filter,
        show_in_position_settings, show_in_headcount_detail, applicant_detail_section, position_detail_section, allow_custom_options,
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
      RETURNING *;
    `,
    buildCustomFieldCreateParams(newFieldId, input)
  );

  return {
    raw: result.rows[0],
    mapped: mapCustomFieldDefinitionRow(result.rows[0]),
    id: newFieldId,
  };
}

export async function customFieldDefinitionIdExists(fieldId: string) {
  const result = await getPool().query<QueryResultRow>('SELECT id FROM "CustomFieldDefinition" WHERE id = $1', [fieldId]);
  return result.rows.length > 0;
}

export function buildCustomFieldUpdateQuery(fieldId: string, updateData: UpdateCustomFieldInput) {
  return buildCustomFieldUpdateQueryObject(fieldId, updateData);
}

export async function updateCustomFieldDefinition(fieldId: string, updateData: UpdateCustomFieldInput) {
  const updateQuery = buildCustomFieldUpdateQuery(fieldId, updateData);
  if (!updateQuery) {
    return null;
  }

  const result = await getPool().query<CustomFieldDefinitionRow>(updateQuery.query, updateQuery.values);
  return {
    raw: result.rows[0],
    mapped: mapCustomFieldDefinitionRow(result.rows[0]),
  };
}

export async function updateCustomFieldDefinitionById(fieldId: string, updateData: UpdateCustomFieldByIdInput) {
  const updateQuery = buildCustomFieldUpdateByIdQuery(fieldId, updateData);
  if (!updateQuery) {
    return null;
  }

  const result = await getPool().query<CustomFieldDefinitionRow>(updateQuery.query, updateQuery.values);
  return {
    raw: result.rows[0],
    mapped: mapCustomFieldDefinitionRow(result.rows[0]),
  };
}

export async function getCustomFieldUsageCount(fieldCode: string) {
  const usageResult = await getPool().query<CountRow>(
    `
      SELECT COUNT(*) as count
      FROM "Applicant"
      WHERE "customAttributes" ? $1
      UNION ALL
      SELECT COUNT(*) as count
      FROM "Position"
      WHERE "customAttributes" ? $1
    `,
    [fieldCode]
  );

  return usageResult.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
}

export async function deleteCustomFieldDefinition(fieldId: string) {
  await getPool().query('DELETE FROM "CustomFieldDefinition" WHERE id = $1', [fieldId]);
}
