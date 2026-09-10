import { Applicant, UserProfile } from '@/lib/types';

/**
 * Get the personal color for a Applicant based on their recruiter
 * @param Applicant - The Applicant object
 * @param recruiters - Array of recruiter objects with personal colors
 * @returns The personal color hex string or default blue
 */
export function getApplicantPersonalColor(applicant: Applicant, recruiters?: UserProfile[]): string {
  if (!applicant.recruiterId || !recruiters) {
    return '#3B82F6'; // Default blue
  }

  const recruiter = recruiters.find(r => r.id === applicant.recruiterId);
  return recruiter?.personalColor || '#3B82F6';
}

/**
 * Get the personal color for a recruiter
 * @param recruiter - The recruiter object
 * @returns The personal color hex string or default blue
 */
export function getRecruiterPersonalColor(recruiter?: UserProfile): string {
  return recruiter?.personalColor || '#3B82F6';
}

/**
 * Apply personal color styles to a Applicant card
 * @param personalColor - The personal color hex string
 * @param isSelected - Whether the card is selected
 * @returns Style object for the card
 */
export function getApplicantCardStyles(personalColor: string, isSelected: boolean = false) {
  if (!isSelected) {
    return {};
  }

  return {
    borderColor: personalColor,
    backgroundColor: `${personalColor}10`,
    boxShadow: `0 4px 6px -1px ${personalColor}20, 0 2px 4px -1px ${personalColor}20`,
  };
}

/**
 * Apply personal color styles to a recruiter avatar
 * @param personalColor - The personal color hex string
 * @returns Style object for the avatar
 */
export function getRecruiterAvatarStyles(personalColor: string) {
  return {
    backgroundColor: personalColor,
    boxShadow: `0 2px 4px -1px ${personalColor}25`,
  };
}

/**
 * Apply personal color styles to a card border
 * @param personalColor - The personal color hex string
 * @param isSelected - Whether the card is selected
 * @returns Style object for the card border
 */
export function getCardBorderStyles(personalColor: string, isSelected: boolean = false) {
  if (!isSelected) {
    return {};
  }

  return {
    borderColor: personalColor,
    boxShadow: `0 0 0 1px ${personalColor}, 0 4px 6px -1px ${personalColor}20`,
  };
}
