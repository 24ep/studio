import type {
  UseFieldArrayReturn,
  UseFormSetValue,
} from 'react-hook-form';
import type {
  EditApplicantFormValues,
  EditEducationEntry,
  EditExperienceEntry,
  EditJobMatchEntry,
  EditJobSuitableEntry,
  EditSkillEntry,
} from './use-applicant-detail-edit-form-schema';

type EducationFieldArray = UseFieldArrayReturn<EditApplicantFormValues, 'parsedData.education', 'field_id'>;
type ExperienceFieldArray = UseFieldArrayReturn<EditApplicantFormValues, 'parsedData.experience', 'field_id'>;
type SkillFieldArray = UseFieldArrayReturn<EditApplicantFormValues, 'parsedData.skills', 'field_id'>;
type JobSuitableFieldArray = UseFieldArrayReturn<EditApplicantFormValues, 'parsedData.job_suitable', 'field_id'>;
type JobMatchesFieldArray = UseFieldArrayReturn<EditApplicantFormValues, 'parsedData.job_matches', 'field_id'>;

export interface ApplicantEditFormFieldArrays {
  education: EducationFieldArray;
  experience: ExperienceFieldArray;
  jobMatches: JobMatchesFieldArray;
  jobSuitable: JobSuitableFieldArray;
  skills: SkillFieldArray;
}

export const APPLICANT_EDIT_FORM_RESET_OPTIONS = {
  keepDefaultValues: false,
  keepDirty: false,
  keepErrors: false,
  keepIsSubmitted: false,
  keepTouched: false,
};

export function applyApplicantEditScalarValues(
  formValues: EditApplicantFormValues,
  setValue: UseFormSetValue<EditApplicantFormValues>
) {
  const personalInfo = formValues.parsedData?.personal_info;

  if (personalInfo) {
    setValue('parsedData.personal_info.title_honorific', personalInfo.title_honorific || '');
    setValue('parsedData.personal_info.firstname', personalInfo.firstname || '');
    setValue('parsedData.personal_info.lastname', personalInfo.lastname || '');
    setValue('parsedData.personal_info.nickname', personalInfo.nickname || '');
    setValue('parsedData.personal_info.location', personalInfo.location || '');
    setValue('parsedData.personal_info.introduction_aboutme', personalInfo.introduction_aboutme || '');
  }

  setValue('email', formValues.email || '');
  setValue('phone', formValues.phone || '');
  setValue('expectedSalary', formValues.expectedSalary);
}

export function replaceApplicantEditFieldArrays(
  formValues: EditApplicantFormValues,
  fieldArrays: ApplicantEditFormFieldArrays
) {
  const parsedData = formValues.parsedData;

  if (!parsedData) {
    return;
  }

  replaceWhenPopulated(parsedData.education, fieldArrays.education.replace);
  replaceWhenPopulated(parsedData.experience, fieldArrays.experience.replace);
  replaceWhenPopulated(parsedData.skills, fieldArrays.skills.replace);
  replaceWhenPopulated(parsedData.job_suitable, fieldArrays.jobSuitable.replace);
  replaceWhenPopulated(parsedData.job_matches, fieldArrays.jobMatches.replace);
}

export function appendApplicantEditEducation(fieldArray: EducationFieldArray, value: unknown) {
  fieldArray.append(value as EditEducationEntry);
}

export function appendApplicantEditExperience(fieldArray: ExperienceFieldArray, value: unknown) {
  fieldArray.append(value as EditExperienceEntry);
}

export function appendApplicantEditSkill(fieldArray: SkillFieldArray, value: unknown) {
  fieldArray.append(value as EditSkillEntry);
}

export function appendApplicantEditJobSuitable(fieldArray: JobSuitableFieldArray, value: unknown) {
  fieldArray.append(value as EditJobSuitableEntry);
}

export function appendApplicantEditJobMatch(fieldArray: JobMatchesFieldArray, value: unknown) {
  fieldArray.append(value as EditJobMatchEntry);
}

function replaceWhenPopulated<T>(entries: T[] | undefined, replace: (value: T[]) => void) {
  if (entries && entries.length > 0) {
    replace(entries);
  }
}
