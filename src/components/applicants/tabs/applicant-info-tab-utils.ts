import { parseApplicantParsedDataRecord } from '../applicant-parsed-data-utils';

export interface ApplicantPersonalInfo {
  title_honorific?: unknown;
  firstname?: unknown;
  lastname?: unknown;
  nickname?: unknown;
  location?: unknown;
  introduction_aboutme?: unknown;
}

export function getApplicantPersonalInfo(parsedData: unknown): ApplicantPersonalInfo | undefined {
  const parsedDataObj = parseApplicantParsedDataRecord(parsedData);
  const personalInfo = parsedDataObj.personal_info;

  return personalInfo && typeof personalInfo === 'object' && !Array.isArray(personalInfo)
    ? personalInfo as ApplicantPersonalInfo
    : undefined;
}

export function composeApplicantInfoFullName(
  title: unknown,
  firstName: unknown,
  lastName: unknown,
): string {
  return [title, firstName, lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map(part => part.trim())
    .join(' ');
}

export function getApplicantInfoFieldValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function getApplicantInfoFormErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return null;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : null;
}
