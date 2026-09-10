import * as z from 'zod';

import { CUSTOM_FIELD_TYPES } from '@/lib/types';
import type { CustomFieldType } from '@/lib/types';

const customFieldOptionSchema = z.object({
  id: z.string().optional(),
  value: z.string().min(1, 'Option value is required'),
  label: z.string().min(1, 'Option label is required'),
  color: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const customFieldFormSchema = z.object({
  model_name: z.string().min(1, 'Model is required'),
  field_code: z.string().min(1, 'Field code is required').regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores.'),
  label: z.string().min(1, 'Label is required'),
  field_type: z.enum(CUSTOM_FIELD_TYPES as [CustomFieldType, ...CustomFieldType[]], { required_error: 'Field type is required' }),
  viewRoles: z.array(z.string().uuid()).default([]),
  editRoles: z.array(z.string().uuid()).default([]),
  showInFilter: z.boolean().default(false),
  showInApplicantDetail: z.boolean().default(false),
  showInFullApplicantDetail: z.boolean().default(false),
  showInTaskBoardFilter: z.boolean().default(false),
  showInPositionSettings: z.boolean().default(false),
  showInHeadcountDetail: z.boolean().default(false),
  is_required: z.boolean().default(false),
  allowCustomOptions: z.boolean().default(false),
  sort_order: z.number().default(0),
  options: z.array(customFieldOptionSchema).optional().default([]),
});

export type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>;

export const CUSTOM_FIELD_FORM_DEFAULT_VALUES: CustomFieldFormValues = {
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
  is_required: false,
  allowCustomOptions: false,
  sort_order: 0,
  options: [],
};
