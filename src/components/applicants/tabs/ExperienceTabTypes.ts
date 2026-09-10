import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { Applicant, CompanyReference, CustomFieldValue } from '@/lib/types';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';

export type ApplicantFormArrayField = {
  id?: string;
  field_id?: string;
};

export type ExperienceDisplayEntry = {
  company?: string | null;
  companyReference?: CompanyReference | null;
  companyReferenceId?: string | null;
  position?: string | null;
  description?: string | null;
  positionLevel?: string | null;
  fitScore?: string | number | null;
  startMonth?: unknown;
  startYear?: unknown;
  endMonth?: unknown;
  endYear?: unknown;
  isCurrent?: unknown;
};

export interface ExperienceTabProps {
  applicant: Applicant;
  isEditing: boolean;
  control?: Control<EditApplicantFormValues>;
  register?: UseFormRegister<EditApplicantFormValues>;
  errors?: FieldErrors<EditApplicantFormValues>;
  watch?: UseFormWatch<EditApplicantFormValues>;
  setValue?: UseFormSetValue<EditApplicantFormValues>;
  experienceFields?: ApplicantFormArrayField[];
  appendExperience?: (value: unknown) => void;
  removeExperience?: (index: number) => void;
  calculateTotalExperienceDuration?: (experience: unknown[]) => string;
  onCustomFieldChange?: (fieldCode: string, value: CustomFieldValue) => void;
}
