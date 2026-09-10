import {
  APPLICANT_TIMELINE_MONTHS,
  buildTimelineYearRange,
  calculateTotalTimelineDuration,
  formatTimelineDuration,
  getParsedTimelineEntries,
  getTimelineDisplay,
  hasTimelineFitScore,
  isCurrentTimelineEntry,
  toFiniteTimelineNumber,
} from './applicant-timeline-utils';

export {
  APPLICANT_TIMELINE_MONTHS as EDUCATION_MONTHS,
  buildTimelineYearRange as buildEducationYearRange,
  calculateTotalTimelineDuration as calculateTotalEducationDuration,
  formatTimelineDuration,
};

export function createEducationDefaults() {
  return {
    university: '',
    major: '',
    field: '',
    campus: '',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    isCurrent: false,
    duration: '',
    GPA: '',
  };
}

export function getParsedEducationEntries(parsedData: unknown): unknown[] {
  return getParsedTimelineEntries(parsedData, 'education');
}

export function isCurrentEducation(entry: { endMonth?: unknown; endYear?: unknown; isCurrent?: unknown }): boolean {
  return isCurrentTimelineEntry(entry);
}

export function getEducationTimelineDisplay(
  entry: {
    startMonth?: unknown;
    startYear?: unknown;
    endMonth?: unknown;
    endYear?: unknown;
    isCurrent?: unknown;
  },
  now = new Date(),
): { startLabel: string; endLabel: string | null; duration: string } | null {
  return getTimelineDisplay(entry, now);
}

export function hasEducationFitScore(entry: { fitScore?: unknown }): boolean {
  return hasTimelineFitScore(entry);
}

export function formatEducationFitGrade(score: unknown): string {
  const numericScore = toFiniteTimelineNumber(score);
  if (numericScore === null) return '';

  if (numericScore >= 90) return 'A+';
  if (numericScore >= 85) return 'A';
  if (numericScore >= 80) return 'A-';
  if (numericScore >= 75) return 'B+';
  if (numericScore >= 70) return 'B';
  if (numericScore >= 65) return 'B-';
  if (numericScore >= 60) return 'C+';
  if (numericScore >= 55) return 'C';
  if (numericScore >= 50) return 'C-';
  return 'D';
}
