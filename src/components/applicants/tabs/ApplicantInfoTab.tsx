import React from 'react';
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from 'react-hook-form';
import type { Applicant } from '@/lib/types';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';
import {
  ApplicantInfoDisplayCard,
  ApplicantInfoEditCards,
} from './ApplicantInfoTabParts';
import {
  getApplicantInfoFormErrorMessage,
} from './applicant-info-tab-utils';

interface ApplicantInfoTabProps {
  applicant: Applicant;
  isEditing: boolean;
  register?: UseFormRegister<EditApplicantFormValues>;
  errors?: FieldErrors<EditApplicantFormValues>;
  watch?: UseFormWatch<EditApplicantFormValues>;
  control?: Control<EditApplicantFormValues>;
}

export const ApplicantInfoTab: React.FC<ApplicantInfoTabProps> = ({
  applicant, 
  isEditing, 
  register, 
  errors, 
  watch, 
  control
}) => {
  const emailError = getApplicantInfoFormErrorMessage(errors?.email);
  const phoneError = getApplicantInfoFormErrorMessage(errors?.phone);
  const firstNameError = getApplicantInfoFormErrorMessage(errors?.parsedData?.personal_info?.firstname);
  const lastNameError = getApplicantInfoFormErrorMessage(errors?.parsedData?.personal_info?.lastname);

  if (isEditing) {
    return (
      <ApplicantInfoEditCards
        register={register}
        watch={watch}
        control={control}
        emailError={emailError}
        phoneError={phoneError}
        firstNameError={firstNameError}
        lastNameError={lastNameError}
      />
    );
  }

  return <ApplicantInfoDisplayCard applicant={applicant} />;
};
