import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import type { Applicant } from '@/lib/types';
import {
  buildApplicantEditFormValues,
  getDefaultApplicantEditFormValues,
} from '../full-applicant-detail-utils';
import {
  APPLICANT_EDIT_FORM_RESET_OPTIONS,
  appendApplicantEditEducation,
  appendApplicantEditExperience,
  appendApplicantEditJobMatch,
  appendApplicantEditJobSuitable,
  appendApplicantEditSkill,
  applyApplicantEditScalarValues,
  replaceApplicantEditFieldArrays,
} from './use-applicant-detail-edit-form-helpers';
import type { EditApplicantFormValues } from './use-applicant-detail-edit-form-schema';

export type { EditApplicantFormValues } from './use-applicant-detail-edit-form-schema';

export function useApplicantDetailEditForm(applicant: Applicant | null, isEditing: boolean) {
  const [formPopulated, setFormPopulated] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EditApplicantFormValues>({
    defaultValues: getDefaultApplicantEditFormValues() as EditApplicantFormValues,
    mode: 'onChange',
    shouldUnregister: false,
  });

  const education = useFieldArray({
    control,
    name: 'parsedData.education',
    keyName: 'field_id',
  });

  const experience = useFieldArray({
    control,
    name: 'parsedData.experience',
    keyName: 'field_id',
  });

  const skills = useFieldArray({
    control,
    name: 'parsedData.skills',
    keyName: 'field_id',
  });

  const jobSuitable = useFieldArray({
    control,
    name: 'parsedData.job_suitable',
    keyName: 'field_id',
  });

  const jobMatches = useFieldArray({
    control,
    name: 'parsedData.job_matches',
    keyName: 'field_id',
  });

  useEffect(() => {
    if (isEditing && applicant && !formPopulated) {
      const formValues = buildApplicantEditFormValues(applicant) as EditApplicantFormValues;

      reset(formValues, APPLICANT_EDIT_FORM_RESET_OPTIONS);

      setTimeout(() => {
        applyApplicantEditScalarValues(formValues, setValue);
      }, 100);

      replaceApplicantEditFieldArrays(formValues, {
        education,
        experience,
        skills,
        jobSuitable,
        jobMatches,
      });

      setFormPopulated(true);
    }
  }, [
    applicant,
    education,
    experience,
    formPopulated,
    isEditing,
    jobMatches,
    jobSuitable,
    reset,
    setValue,
    skills,
  ]);

  useEffect(() => {
    if (!isEditing) {
      setFormPopulated(false);
    }
  }, [isEditing]);

  return {
    appendEducation: (value: unknown) => appendApplicantEditEducation(education, value),
    appendExperience: (value: unknown) => appendApplicantEditExperience(experience, value),
    appendJobMatch: (value: unknown) => appendApplicantEditJobMatch(jobMatches, value),
    appendJobSuitable: (value: unknown) => appendApplicantEditJobSuitable(jobSuitable, value),
    appendSkill: (value: unknown) => appendApplicantEditSkill(skills, value),
    control,
    educationFields: education.fields,
    errors,
    experienceFields: experience.fields,
    formPopulated,
    handleSubmit,
    jobMatchesFields: jobMatches.fields,
    jobSuitableFields: jobSuitable.fields,
    register,
    removeEducation: education.remove,
    removeExperience: experience.remove,
    removeJobMatch: jobMatches.remove,
    removeJobSuitable: jobSuitable.remove,
    removeSkill: skills.remove,
    reset,
    setFormPopulated,
    setValue,
    skillsFields: skills.fields,
    watch,
  };
}
