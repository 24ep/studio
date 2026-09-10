import { describe, expect, it } from 'vitest';
import {
  buildCustomFieldCreateParams,
  buildCustomFieldUpdateByIdQuery,
  buildCustomFieldUpdateQuery,
  mapCustomFieldDefinitionRow,
  type CustomFieldDefinitionRow,
} from './custom-field-definition-query-utils';

const now = new Date('2026-01-01T00:00:00.000Z');

function row(overrides: Partial<CustomFieldDefinitionRow> = {}): CustomFieldDefinitionRow {
  return {
    id: 'field-1',
    model_name: 'applicant',
    field_key: 'favorite_color',
    field_code: 'favorite_color',
    label: 'Favorite Color',
    field_type: 'text',
    options: null,
    attribute_code: null,
    view_roles: null,
    edit_roles: null,
    show_in_filter: null,
    show_in_applicant_detail: null,
    show_in_full_applicant_detail: null,
    show_in_task_board_filter: null,
    show_in_position_settings: null,
    show_in_headcount_detail: null,
    applicant_detail_section: null,
    position_detail_section: null,
    is_required: false,
    allow_custom_options: null,
    sort_order: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('custom-field-definition-query-utils', () => {
  it('maps database rows with API defaults', () => {
    expect(mapCustomFieldDefinitionRow(row())).toMatchObject({
      id: 'field-1',
      options: [],
      viewRoles: [],
      editRoles: [],
      showInFilter: false,
      allowCustomOptions: false,
      sort_order: 0,
    });

    expect(mapCustomFieldDefinitionRow(row({
      options: [{ label: 'Red', value: 'red' }],
      view_roles: ['Admin'],
      show_in_filter: true,
      allow_custom_options: true,
      sort_order: 7,
    }))).toMatchObject({
      options: [{ label: 'Red', value: 'red' }],
      viewRoles: ['Admin'],
      showInFilter: true,
      allowCustomOptions: true,
      sort_order: 7,
    });
  });

  it('builds create params in insert-column order', () => {
    expect(buildCustomFieldCreateParams('field-1', {
      model_name: 'Applicant',
      field_code: 'favorite_color',
      label: 'Favorite Color',
      field_type: 'select_single',
      options: [{ label: 'Red', value: 'red', sortOrder: 0, isActive: true }],
      is_required: true,
      sort_order: 3,
      viewRoles: ['Admin'],
      editRoles: ['Recruiter'],
      showInFilter: true,
      showInApplicantDetail: true,
      showInFullApplicantDetail: false,
      showInTaskBoardFilter: false,
      showInPositionSettings: false,
      showInHeadcountDetail: false,
      applicantDetailSection: 'Applicant-info',
      positionDetailSection: null,
      allowCustomOptions: true,
    })).toEqual([
      'field-1',
      'Applicant',
      'favorite_color',
      'favorite_color',
      'Favorite Color',
      'select_single',
      [{ label: 'Red', value: 'red', sortOrder: 0, isActive: true }],
      true,
      3,
      'favorite_color',
      null,
      ['Admin'],
      ['Recruiter'],
      true,
      true,
      false,
      false,
      false,
      false,
      'Applicant-info',
      null,
      true,
    ]);
  });

  it('builds sparse update queries and skips undefined values', () => {
    expect(buildCustomFieldUpdateQuery('field-1', {})).toBeNull();

    expect(buildCustomFieldUpdateQuery('field-1', {
      label: 'Updated',
      showInFilter: false,
    })).toEqual({
      query: `
      UPDATE "CustomFieldDefinition"
      SET label = $1, show_in_filter = $2, "updatedAt" = NOW()
      WHERE id = $3
      RETURNING *;
    `,
      values: ['Updated', false, 'field-1'],
    });

    expect(buildCustomFieldUpdateByIdQuery('field-1', {
      model_name: 'Position',
      field_code: 'role_level',
    })?.values).toEqual(['Position', 'role_level', 'field-1']);
  });
});
