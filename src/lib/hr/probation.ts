export const DEFAULT_PROBATION_PERIOD_DAYS = 90;
export const DEFAULT_PROBATION_EVALUATION_FREQUENCY_DAYS = 30;

export interface ProbationScheduleInput {
  hireDate: Date | string | null | undefined;
  probationPeriodDays?: number | null;
  evaluationFrequencyDays?: number | null;
  now?: Date;
}

export interface ProbationSchedule {
  startDate: Date;
  endDate: Date;
  nextEvaluationDate: Date;
  evaluationNumber: number;
  daysRemaining: number;
  progressPercent: number;
  isOnProbation: boolean;
  periodDays: number;
  evaluationFrequencyDays: number;
}

function positiveDays(value: number | null | undefined, fallback: number) {
  return Number.isFinite(value) && Number(value) > 0 ? Math.round(Number(value)) : fallback;
}

function calendarDate(value: Date | string) {
  if (typeof value === 'string') {
    const datePart = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (datePart) {
      return new Date(Date.UTC(Number(datePart[1]), Number(datePart[2]) - 1, Number(datePart[3])));
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addCalendarDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function differenceInDays(later: Date, earlier: Date) {
  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000);
}

export function calculateProbationSchedule({
  hireDate,
  probationPeriodDays,
  evaluationFrequencyDays,
  now = new Date(),
}: ProbationScheduleInput): ProbationSchedule | null {
  if (!hireDate) return null;

  const startDate = calendarDate(hireDate);
  const today = calendarDate(now);
  if (!startDate || !today) return null;
  const periodDays = positiveDays(probationPeriodDays, DEFAULT_PROBATION_PERIOD_DAYS);
  const cadenceDays = positiveDays(
    evaluationFrequencyDays,
    DEFAULT_PROBATION_EVALUATION_FREQUENCY_DAYS,
  );
  const endDate = addCalendarDays(startDate, periodDays);
  const elapsedDays = Math.max(0, differenceInDays(today, startDate));
  const nextEvaluationNumber = Math.max(1, Math.ceil(elapsedDays / cadenceDays));
  const scheduledEvaluation = addCalendarDays(startDate, nextEvaluationNumber * cadenceDays);
  const nextEvaluationDate = scheduledEvaluation > endDate ? endDate : scheduledEvaluation;
  const daysRemaining = differenceInDays(endDate, today);

  return {
    startDate,
    endDate,
    nextEvaluationDate,
    evaluationNumber: nextEvaluationNumber,
    daysRemaining,
    progressPercent: Math.min(100, Math.max(0, Math.round((elapsedDays / periodDays) * 100))),
    isOnProbation: today >= startDate && today <= endDate,
    periodDays,
    evaluationFrequencyDays: cadenceDays,
  };
}

export function formatProbationDate(value: Date | string | null | undefined) {
  if (!value) return 'Not set';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
