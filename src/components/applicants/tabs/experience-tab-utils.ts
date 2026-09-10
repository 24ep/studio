import {
  APPLICANT_TIMELINE_MONTHS,
  buildTimelineYearRange,
  getParsedTimelineEntries,
  getTimelineDisplay,
  hasTimelineFitScore,
  toFiniteTimelineNumber,
} from './applicant-timeline-utils';

export {
  APPLICANT_TIMELINE_MONTHS as EXPERIENCE_MONTHS,
  buildTimelineYearRange as buildExperienceYearRange,
};

export function createExperienceDefaults() {
  return {
    company: '',
    position: '',
    description: '',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    isCurrent: false,
    duration: '',
    positionLevel: '',
  };
}

export function getParsedExperienceEntries(parsedData: unknown): unknown[] {
  return getParsedTimelineEntries(parsedData, 'experience');
}

export function getExperienceTimelineDisplay(
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

export function hasExperienceFitScore(entry: { fitScore?: unknown }): boolean {
  return hasTimelineFitScore(entry);
}

export function getExperienceFitScoreValue(entry: { fitScore?: unknown }): number | null {
  return toFiniteTimelineNumber(entry.fitScore);
}

export function isVisiblePositionLevel(positionLevel: unknown): positionLevel is string {
  return typeof positionLevel === 'string' && positionLevel.trim() !== '' && positionLevel !== 'undefined';
}
