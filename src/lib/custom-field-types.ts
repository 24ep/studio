export type UIDisplayPreference = 'Standard' | 'Emphasized' | 'Hidden';

export interface AttributePreference {
  path: string;
  uiPreference: UIDisplayPreference;
  customNote: string;
}

export interface ModelAttributeDefinition {
  key: string;
  label: string;
  type: string;
  description?: string;
  subAttributes?: ModelAttributeDefinition[];
  arrayItemType?: string;
}

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select_single'
  | 'select_multiple';

export const CUSTOM_FIELD_TYPES: CustomFieldType[] = [
  'text',
  'textarea',
  'number',
  'boolean',
  'date',
  'select_single',
  'select_multiple',
];

export interface CustomFieldOption {
  id?: string;
  value: string;
  label: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomFieldValue = string | number | boolean | string[] | null | undefined;
export type CustomFieldValues = Record<string, CustomFieldValue>;

export interface CustomFieldDefinition {
  id: string;
  model_name: string;
  field_key: string;
  field_code: string;
  label: string;
  field_type: CustomFieldType;
  options?: CustomFieldOption[] | null;
  is_required?: boolean;
  sort_order?: number;

  // Enhanced custom attribute fields
  attributeCode?: string;

  // Role permissions - using role IDs (UUIDs)
  viewRoles?: string[];
  editRoles?: string[];

  // Visibility settings
  showInFilter?: boolean;
  showInApplicantDetail?: boolean;
  showInFullApplicantDetail?: boolean;
  showInTaskBoardFilter?: boolean;
  showInPositionSettings?: boolean;
  showInHeadcountDetail?: boolean;

  // Section selection for display settings
  applicantDetailSection?: 'jobs' | 'applicant-info' | 'education' | 'experience' | 'job-suitability';
  positionDetailSection?: 'details' | 'criteria' | 'applicants' | 'headcount';

  // For select/multiselect fields
  allowCustomOptions?: boolean;

  createdAt?: string;
  updatedAt?: string;
}
