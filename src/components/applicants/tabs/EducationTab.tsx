import React from 'react';
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { Applicant, CustomFieldValue } from '@/lib/types';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';
import { getParsedEducationEntries } from './education-tab-utils';
import {
  EducationCustomFields,
  EducationEditCard,
  EducationTimelineCard,
  type ApplicantFormArrayField,
} from './EducationTabParts';

interface EducationTabProps {
  applicant: Applicant;
  isEditing: boolean;
  control?: Control<EditApplicantFormValues>;
  register?: UseFormRegister<EditApplicantFormValues>;
  errors?: FieldErrors<EditApplicantFormValues>;
  watch?: UseFormWatch<EditApplicantFormValues>;
  setValue?: UseFormSetValue<EditApplicantFormValues>;
  educationFields?: ApplicantFormArrayField[];
  appendEducation?: (value: unknown) => void;
  removeEducation?: (index: number) => void;
  onCustomFieldChange?: (fieldCode: string, value: CustomFieldValue) => void;
}

export const EducationTab: React.FC<EducationTabProps> = ({
  applicant,
  isEditing,
  control: _control,
  register,
  errors: _errors,
  watch,
  setValue,
  educationFields = [],
  appendEducation,
  removeEducation,
  onCustomFieldChange
}) => {
  const education = getParsedEducationEntries(applicant.parsedData);

  if (isEditing) {
    return (
      <div className="space-y-4">
        <EducationEditCard
          register={register}
          watch={watch}
          setValue={setValue}
          educationFields={educationFields}
          appendEducation={appendEducation}
          removeEducation={removeEducation}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EducationTimelineCard education={education} />
      <EducationCustomFields
        applicant={applicant}
        isEditing={isEditing}
        onCustomFieldChange={onCustomFieldChange}
      />
    </div>
  );
};
