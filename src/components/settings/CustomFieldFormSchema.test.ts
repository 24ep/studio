import { describe, expect, it } from 'vitest';
import type { CustomFieldDefinition } from '../../lib/types';
import {
  buildCustomFieldFormValues,
  EMPTY_CUSTOM_FIELD_FORM_VALUES,
} from './CustomFieldFormSchema';

describe('CustomFieldFormSchema', () => {
  it('returns empty form values when no definition is provided', () => {
    expect(buildCustomFieldFormValues()).toEqual(EMPTY_CUSTOM_FIELD_FORM_VALUES);
  });

  it('maps a custom field definition to legacy form values', () => {
    const definition: CustomFieldDefinition = {
      id: 'field-1',
      model_name: 'Applicant',
      field_key: 'linkedin_url',
      field_code: 'LINKEDIN_URL',
      label: 'LinkedIn URL',
      field_type: 'select_single',
      options: [
        { id: 'option-1', value: 'yes', label: 'Yes', color: '#16a34a', sortOrder: 2 },
      ],
      is_required: true,
      sort_order: 7,
    };

    expect(buildCustomFieldFormValues(definition)).toEqual({
      model_name: 'Applicant',
      field_key: 'linkedin_url',
      label: 'LinkedIn URL',
      field_type: 'select_single',
      options: [{ value: 'yes', label: 'Yes' }],
      is_required: true,
      sort_order: 7,
    });
  });
});
