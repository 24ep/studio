import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CUSTOM_FIELD_TYPES } from '@/lib/types';
import type { CustomFieldDefinition, CustomFieldType } from '@/lib/types';

const customFieldOptionSchema = z.object({
  id: z.string().optional(),
  value: z.string().min(1, "Option value is required"),
  label: z.string().min(1, "Option label is required"),
  color: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const customFieldFormSchema = z.object({
  model_name: z.string().min(1, "Model is required"),
  field_code: z.string().min(1, "Field code is required").regex(/^[A-Z0-9_]+$/, "Code must be uppercase alphanumeric with underscores."),
  label: z.string().min(1, "Label is required"),
  field_type: z.enum(CUSTOM_FIELD_TYPES as [CustomFieldType, ...CustomFieldType[]], { required_error: "Field type is required" }),
  viewRoles: z.array(z.string().uuid()).default([]),
  editRoles: z.array(z.string().uuid()).default([]),
  showInFilter: z.boolean().default(false),
  showInApplicantDetail: z.boolean().default(false),
  showInFullApplicantDetail: z.boolean().default(false),
  showInTaskBoardFilter: z.boolean().default(false),
  showInPositionSettings: z.boolean().default(false),
  showInHeadcountDetail: z.boolean().default(false),
  applicantDetailSection: z.enum(['jobs', 'applicant-info', 'education', 'experience', 'job-suitability']).optional().nullable(),
  positionDetailSection: z.enum(['details', 'criteria', 'applicants', 'headcount']).optional().nullable(),
  is_required: z.boolean().default(false),
  allowCustomOptions: z.boolean().default(false),
  sort_order: z.number().default(0),
  options: z.array(customFieldOptionSchema).optional().default([]),
});

export type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>;

export const customFieldFormResolver = zodResolver(customFieldFormSchema);

export const EMPTY_CUSTOM_FIELD_FORM_VALUES: CustomFieldFormValues = {
  model_name: 'Applicant',
  field_code: '',
  label: '',
  field_type: 'text',
  viewRoles: [],
  editRoles: [],
  showInFilter: false,
  showInApplicantDetail: false,
  showInFullApplicantDetail: false,
  showInTaskBoardFilter: false,
  showInPositionSettings: false,
  showInHeadcountDetail: false,
  applicantDetailSection: undefined,
  positionDetailSection: undefined,
  is_required: false,
  allowCustomOptions: false,
  sort_order: 0,
  options: [],
};

export function buildCustomFieldFormValues(
  definition?: CustomFieldDefinition | null
): CustomFieldFormValues {
  if (!definition) {
    return EMPTY_CUSTOM_FIELD_FORM_VALUES;
  }

  return {
    model_name: definition.model_name,
    field_code: definition.field_code,
    label: definition.label,
    field_type: definition.field_type,
    viewRoles: Array.isArray(definition.viewRoles) ? definition.viewRoles : [],
    editRoles: Array.isArray(definition.editRoles) ? definition.editRoles : [],
    showInFilter: definition.showInFilter || false,
    showInApplicantDetail: definition.showInApplicantDetail || false,
    showInFullApplicantDetail: definition.showInFullApplicantDetail || false,
    showInTaskBoardFilter: definition.showInTaskBoardFilter || false,
    showInPositionSettings: definition.showInPositionSettings || false,
    applicantDetailSection: definition.applicantDetailSection || undefined,
    positionDetailSection: definition.positionDetailSection || undefined,
    showInHeadcountDetail: definition.showInHeadcountDetail || false,
    is_required: definition.is_required || false,
    allowCustomOptions: definition.allowCustomOptions || false,
    sort_order: definition.sort_order || 0,
    options: Array.isArray(definition.options)
      ? definition.options.map((option, index) => ({
          id: option.id,
          value: option.value,
          label: option.label,
          color: option.color,
          sortOrder: option.sortOrder ?? index,
          isActive: option.isActive ?? true,
        }))
      : [],
  };
}
