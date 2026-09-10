import type { Applicant } from '@/lib/types';
import { containsThaiText, getFontClass } from './fontUtils';

type ApplicantNameSource = Partial<Applicant> & { id?: string; name: string };

/**
 * Formats Applicant name as "Title FirstName LastName" or "FirstName LastName"
 * Falls back to applicant.name if personal info is not available
 * @param includeTitle - Whether to include the title in the formatted name (default: true)
 */
export const formatApplicantName = (applicant: ApplicantNameSource | null | undefined, includeTitle: boolean = true): string => {
  // If Applicant is null/undefined or doesn't have required properties, return loading state
  if (!applicant) {
    return 'Loading...';
  }
  
  const personalInfo = (applicant.parsedData && 'personal_info' in applicant.parsedData)
    ? applicant.parsedData.personal_info
    : undefined;
  
  if (personalInfo) {
    const title = includeTitle ? personalInfo.title_honorific?.trim() : undefined;
    const firstName = personalInfo.firstname?.trim();
    const lastName = personalInfo.lastname?.trim();
    
    const parts = [title, firstName, lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : applicant.name || 'Loading...';
  }
  
  return applicant.name || 'Loading...';
};

/**
 * Gets the raw Applicant name without title (FirstName LastName)
 * Falls back to applicant.name if personal info is not available
 */
export const getRawApplicantName = (applicant: ApplicantNameSource): string => {
  return formatApplicantName(applicant, false);
};

/**
 * Gets the appropriate font class for Applicant name
 * @param Applicant - The Applicant object
 * @returns CSS class for the appropriate font
 */
export const getApplicantNameFontClass = (applicant: ApplicantNameSource): string => {
  const name = formatApplicantName(applicant);
  return getFontClass(name);
};

/**
 * Checks if Applicant name contains Thai text
 * @param Applicant - The Applicant object
 * @returns boolean indicating if name contains Thai characters
 */
export const hasThaiName = (applicant: ApplicantNameSource): boolean => {
  const name = formatApplicantName(applicant);
  return containsThaiText(name);
};

/**
 * Formats Applicant name with proper language attribute
 * @param Applicant - The Applicant object
 * @returns Object with formatted name and language attributes
 */
export const formatApplicantNameWithLang = (applicant: ApplicantNameSource) => {
  const name = formatApplicantName(applicant);
  const hasThai = containsThaiText(name);
  
  return {
    name,
    lang: hasThai ? 'th' : 'en',
    fontClass: getFontClass(name),
    hasThai
  };
}; 
