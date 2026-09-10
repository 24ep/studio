export const SINGLE_ROW_APPLICANT_SCROLL_STEP = 280;
export const SINGLE_ROW_APPLICANT_CONTAINER_CLASS = 'applicants-horizontal-container';

export function getSingleRowApplicantInitial(displayName: string | null | undefined) {
  return displayName?.charAt(0)?.toUpperCase() || 'C';
}

export function getSingleRowApplicantCountLabel(count: number) {
  return `${count} applicant${count !== 1 ? 's' : ''}`;
}

export function shouldShowSingleRowScrollHint(count: number) {
  return count > 3;
}
