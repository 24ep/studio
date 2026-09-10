import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CUSTOM_FIELD_TYPES } from '../../lib/types';
import type { CustomFieldDefinition, CustomFieldType } from '../../lib/types';

const customFieldOptionSchemaClient = z.object({
  value: z.string().min(1, 'Option value is required'),
  label: z.string().min(1, 'Option label is required'),
});

export const customFieldFormSchema = z.object({
  model_name: z.string().min(1, 'Model is required'),
  field_key: z.string().min(1, 'Field key is required').regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores.'),
  label: z.string().min(1, 'Label is required'),
  field_type: z.enum(CUSTOM_FIELD_TYPES as [CustomFieldType, ...CustomFieldType[]], { required_error: 'Field type is required' }),
  options: z.array(customFieldOptionSchemaClient).optional(),
  is_required: z.boolean().optional().default(false),
  sort_order: z.coerce.number().int().optional().default(0),
});

export type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>;

export const customFieldFormResolver = zodResolver(customFieldFormSchema);

export const EMPTY_CUSTOM_FIELD_FORM_VALUES: CustomFieldFormValues = {
  model_name: 'Applicant',
  field_key: '',
  label: '',
  field_type: 'text',
  options: [],
  is_required: false,
  sort_order: 0,
};

export function buildCustomFieldFormValues(
  definition?: CustomFieldDefinition | null
): CustomFieldFormValues {
  if (!definition) {
    return EMPTY_CUSTOM_FIELD_FORM_VALUES;
  }

  return {
    model_name: definition.model_name,
    field_key: definition.field_key,
    label: definition.label,
    field_type: definition.field_type,
    options: Array.isArray(definition.options)
      ? definition.options.map((option) => ({
          value: option.value,
          label: option.label,
        }))
      : [],
    is_required: definition.is_required || false,
    sort_order: definition.sort_order || 0,
  };
}
