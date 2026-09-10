import type { UseFormRegister } from 'react-hook-form';

import type { Applicant, CustomFieldValue } from '@/lib/types';
import type { ApplicantParsedRecord } from '../applicant-parsed-data-utils';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';

export interface ContactSkillField {
  id?: string;
  field_id?: string;
}

export interface ApplicantContactInfo extends ApplicantParsedRecord {
  email?: string;
  phone?: string;
}

export interface ApplicantSkillInfo extends ApplicantParsedRecord {
  segment_skill?: string;
  skill?: string[];
  skill_string?: string;
}

export interface ContactTabProps {
  applicant: Applicant;
  isEditing: boolean;
  register?: UseFormRegister<EditApplicantFormValues>;
  errors?: unknown;
  watch?: unknown;
  setValue?: unknown;
  skillsFields?: ContactSkillField[];
  appendSkill?: (value: ApplicantSkillInfo) => void;
  removeSkill?: (index: number) => void;
  onCustomFieldChange?: (fieldCode: string, value: CustomFieldValue) => void;
  customFieldsRefreshTrigger?: number;
}
