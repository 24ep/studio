import type { QueryResultRow } from 'pg';
import type { CustomFieldDefinition, CustomFieldOption, CustomFieldType } from '@/lib/types';
import type {
  CreateCustomFieldInput,
  UpdateCustomFieldByIdInput,
  UpdateCustomFieldInput,
} from './custom-field-definition-schema';

export const CUSTOM_FIELD_SELECT_COLUMNS = `
  id, model_name, field_key, field_code, label, field_type, options,
  is_required, sort_order, attribute_code,
  view_roles, edit_roles, show_in_filter, show_in_applicant_detail,
  show_in_full_applicant_detail, show_in_task_board_filter,
  show_in_position_settings, show_in_headcount_detail, applicant_detail_section, position_detail_section, allow_custom_options,
  "createdAt", "updatedAt"
`;

export type CustomFieldDefinitionRow = QueryResultRow & {
  id: string;
  model_name: string;
  field_key: string;
  field_code: string;
  label: string;
  field_type: string;
  options: unknown[] | null;
  attribute_code: string | null;
  view_roles: string[] | null;
  edit_roles: string[] | null;
  show_in_filter: boolean | null;
  show_in_applicant_detail: boolean | null;
  show_in_full_applicant_detail: boolean | null;
  show_in_task_board_filter: boolean | null;
  show_in_position_settings: boolean | null;
  show_in_headcount_detail: boolean | null;
  applicant_detail_section: string | null;
  position_detail_section: string | null;
  is_required: boolean;
  allow_custom_options: boolean | null;
  sort_order: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CountRow = QueryResultRow & {
  count: string;
};

const UPDATE_FIELD_MAP: Array<[keyof UpdateCustomFieldInput, string]> = [
  ['label', 'label'],
  ['field_type', 'field_type'],
  ['options', 'options'],
  ['viewRoles', 'view_roles'],
  ['editRoles', 'edit_roles'],
  ['showInFilter', 'show_in_filter'],
  ['showInApplicantDetail', 'show_in_applicant_detail'],
  ['showInFullApplicantDetail', 'show_in_full_applicant_detail'],
  ['showInTaskBoardFilter', 'show_in_task_board_filter'],
  ['showInPositionSettings', 'show_in_position_settings'],
  ['showInHeadcountDetail', 'show_in_headcount_detail'],
  ['applicantDetailSection', 'applicant_detail_section'],
  ['positionDetailSection', 'position_detail_section'],
  ['is_required', 'is_required'],
  ['allowCustomOptions', 'allow_custom_options'],
  ['sort_order', 'sort_order'],
];

const UPDATE_BY_ID_FIELD_MAP: Array<[keyof UpdateCustomFieldByIdInput, string]> = [
  ['model_name', 'model_name'],
  ['field_code', 'field_code'],
  ['label', 'label'],
  ['field_type', 'field_type'],
  ['options', 'options'],
  ['viewRoles', 'view_roles'],
  ['editRoles', 'edit_roles'],
  ['showInFilter', 'show_in_filter'],
  ['showInApplicantDetail', 'show_in_applicant_detail'],
  ['showInFullApplicantDetail', 'show_in_full_applicant_detail'],
  ['showInTaskBoardFilter', 'show_in_task_board_filter'],
  ['showInPositionSettings', 'show_in_position_settings'],
  ['showInHeadcountDetail', 'show_in_headcount_detail'],
  ['applicantDetailSection', 'applicant_detail_section'],
  ['positionDetailSection', 'position_detail_section'],
  ['is_required', 'is_required'],
  ['allowCustomOptions', 'allow_custom_options'],
  ['sort_order', 'sort_order'],
];

export function mapCustomFieldDefinitionRow(row: CustomFieldDefinitionRow) {
  return {
    id: row.id,
    model_name: row.model_name,
    field_key: row.field_key,
    field_code: row.field_code,
    label: row.label,
    field_type: row.field_type as CustomFieldType,
    options: (row.options || []) as CustomFieldOption[],
    attributeCode: row.attribute_code || undefined,
    viewRoles: row.view_roles || [],
    editRoles: row.edit_roles || [],
    showInFilter: row.show_in_filter || false,
    showInApplicantDetail: row.show_in_applicant_detail || false,
    showInFullApplicantDetail: row.show_in_full_applicant_detail || false,
    showInTaskBoardFilter: row.show_in_task_board_filter || false,
    showInPositionSettings: row.show_in_position_settings || false,
    showInHeadcountDetail: row.show_in_headcount_detail || false,
    applicantDetailSection: (row.applicant_detail_section || undefined) as CustomFieldDefinition['applicantDetailSection'],
    positionDetailSection: (row.position_detail_section || undefined) as CustomFieldDefinition['positionDetailSection'],
    is_required: row.is_required,
    allowCustomOptions: row.allow_custom_options || false,
    sort_order: row.sort_order ?? 0,
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

export function buildCustomFieldCreateParams(newFieldId: string, input: CreateCustomFieldInput) {
  return [
    newFieldId,
    input.model_name,
    input.field_code,
    input.field_code,
    input.label,
    input.field_type,
    input.options || null,
    input.is_required,
    input.sort_order,
    input.field_code,
    null,
    input.viewRoles || [],
    input.editRoles || [],
    input.showInFilter,
    input.showInApplicantDetail,
    input.showInFullApplicantDetail,
    input.showInTaskBoardFilter,
    input.showInPositionSettings,
    input.showInHeadcountDetail,
    input.applicantDetailSection,
    input.positionDetailSection,
    input.allowCustomOptions,
  ];
}

export function buildCustomFieldUpdateQuery(fieldId: string, updateData: UpdateCustomFieldInput) {
  return buildUpdateQuery(fieldId, updateData, UPDATE_FIELD_MAP);
}

export function buildCustomFieldUpdateByIdQuery(fieldId: string, updateData: UpdateCustomFieldByIdInput) {
  return buildUpdateQuery(fieldId, updateData, UPDATE_BY_ID_FIELD_MAP);
}

function buildUpdateQuery<T extends Record<string, unknown>>(
  fieldId: string,
  updateData: T,
  fieldMap: Array<[keyof T, string]>
) {
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];
  let paramIndex = 1;

  fieldMap.forEach(([inputKey, columnName]) => {
    const value = updateData[inputKey];
    if (value !== undefined) {
      updateFields.push(`${columnName} = $${paramIndex++}`);
      updateValues.push(value);
    }
  });

  if (updateFields.length === 0) {
    return null;
  }

  updateFields.push('"updatedAt" = NOW()');
  updateValues.push(fieldId);

  return {
    query: `
      UPDATE "CustomFieldDefinition"
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `,
    values: updateValues,
  };
}
