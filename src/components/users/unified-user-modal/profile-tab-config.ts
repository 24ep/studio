import type { UnifiedUserFormValues } from './types';

export type ProfileTextFieldName =
  | 'department'
  | 'positionTitle'
  | 'officeLocation'
  | 'email'
  | 'phoneNumber';

export type ProfileFieldIcon = 'building' | 'briefcase' | 'mapPin' | 'mail' | 'phone';

export interface ProfileTextFieldConfig {
  name: ProfileTextFieldName;
  icon: ProfileFieldIcon;
  label: string;
  placeholder: string;
  valueFallback?: string;
}

export const PROFILE_ORGANIZATION_FIELDS: ProfileTextFieldConfig[] = [
  {
    name: 'department',
    icon: 'building',
    label: 'Department',
    placeholder: 'e.g. Engineering',
    valueFallback: '',
  },
  {
    name: 'positionTitle',
    icon: 'briefcase',
    label: 'Job Title',
    placeholder: 'e.g. Senior Recruiter',
    valueFallback: '',
  },
  {
    name: 'officeLocation',
    icon: 'mapPin',
    label: 'Office Location',
    placeholder: 'e.g. New York HQ',
    valueFallback: '',
  },
];

export const PROFILE_BASIC_FIELDS: ProfileTextFieldConfig[] = [
  {
    name: 'email',
    icon: 'mail',
    label: 'Email Address',
    placeholder: 'email@company.com',
  },
  {
    name: 'phoneNumber',
    icon: 'phone',
    label: 'Mobile Phone',
    placeholder: '+1 (555) 000-0000',
    valueFallback: '',
  },
];

export function getProfileTextFieldValue(
  value: UnifiedUserFormValues[ProfileTextFieldName],
) {
  return value || '';
}
