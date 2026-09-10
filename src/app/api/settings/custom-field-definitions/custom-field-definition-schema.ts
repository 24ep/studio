import { z } from 'zod';
import { isPlatformDataModelName } from '@/lib/data-model-field-management';

const customFieldOptionSchema = z.object({
  id: z.string().optional(),
  value: z.string().min(1, 'Option value is required'),
  label: z.string().min(1, 'Option label is required'),
  color: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

const rolesSchema = z.array(z.string().uuid()).default([]).or(z.string().transform(() => []));
const optionsSchema = z.array(customFieldOptionSchema).optional().default([]).or(z.string().transform(() => []));

const platformModelNameSchema = z.string().min(1, 'Model is required').refine(
  isPlatformDataModelName,
  'Model must be a valid platform data model.'
);

export const createCustomFieldSchema = z.object({
  model_name: platformModelNameSchema,
  field_code: z.string().min(1, 'Field code is required').regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores.'),
  label: z.string().min(1, 'Label is required'),
  field_type: z.enum(['text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple']),
  viewRoles: rolesSchema,
  editRoles: rolesSchema,
  showInFilter: z.boolean().default(false),
  showInApplicantDetail: z.boolean().default(false),
  showInFullApplicantDetail: z.boolean().default(false),
  showInTaskBoardFilter: z.boolean().default(false),
  showInPositionSettings: z.boolean().default(false),
  showInHeadcountDetail: z.boolean().default(false),
  applicantDetailSection: z.enum(['jobs', 'Applicant-info', 'education', 'experience', 'job-suitability']).optional().nullable(),
  positionDetailSection: z.enum(['details', 'criteria', 'Applicants', 'headcount']).optional().nullable(),
  is_required: z.boolean().default(false),
  allowCustomOptions: z.boolean().default(false),
  sort_order: z.number().default(0),
  options: optionsSchema,
});

export const updateCustomFieldSchema = createCustomFieldSchema.partial().omit({
  model_name: true,
  field_code: true,
});

export const updateCustomFieldByIdSchema = z.object({
  model_name: platformModelNameSchema.optional(),
  field_code: z.string().min(1, 'Field code is required').regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores.').optional(),
  label: z.string().min(1, 'Label is required').optional(),
  field_type: z.enum(['text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple']).optional(),
  viewRoles: z.array(z.string().uuid()).optional(),
  editRoles: z.array(z.string().uuid()).optional(),
  showInFilter: z.boolean().optional(),
  showInApplicantDetail: z.boolean().optional(),
  showInFullApplicantDetail: z.boolean().optional(),
  showInTaskBoardFilter: z.boolean().optional(),
  showInPositionSettings: z.boolean().optional(),
  showInHeadcountDetail: z.boolean().optional(),
  applicantDetailSection: z.enum(['jobs', 'Applicant-info', 'education', 'experience', 'job-suitability']).optional(),
  positionDetailSection: z.enum(['details', 'criteria', 'Applicants', 'applicants', 'headcount']).optional(),
  is_required: z.boolean().optional(),
  allowCustomOptions: z.boolean().optional(),
  sort_order: z.number().optional(),
  options: z.array(customFieldOptionSchema).optional().nullable(),
});

export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomFieldInput = z.infer<typeof updateCustomFieldSchema>;
export type UpdateCustomFieldByIdInput = z.infer<typeof updateCustomFieldByIdSchema>;

export type CustomFieldModelName = CreateCustomFieldInput['model_name'];
