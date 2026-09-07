import prisma from '@/lib/prisma';

export type TimePolicyConfig = {
  timezone: string;
  standardWeeklyHours: number;
  lateGraceMinutes: number;
  overtimeApprovalRequired: boolean;
  overtimeRoundingMinutes: number;
  minimumShiftRestHours: number;
  holidayWorkMultiplier: number;
};

export const DEFAULT_TIME_POLICY_CONFIG: TimePolicyConfig = {
  timezone: 'Asia/Bangkok',
  standardWeeklyHours: 40,
  lateGraceMinutes: 10,
  overtimeApprovalRequired: true,
  overtimeRoundingMinutes: 15,
  minimumShiftRestHours: 11,
  holidayWorkMultiplier: 2,
};

const boundedNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : fallback;
};

export function parseTimePolicyConfig(value: unknown): TimePolicyConfig {
  let input: Record<string, unknown> = {};
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) input = parsed as Record<string, unknown>;
    } catch {
      return { ...DEFAULT_TIME_POLICY_CONFIG };
    }
  } else if (value && typeof value === 'object' && !Array.isArray(value)) {
    input = value as Record<string, unknown>;
  }

  return {
    timezone: typeof input.timezone === 'string' && input.timezone.trim() ? input.timezone.trim() : DEFAULT_TIME_POLICY_CONFIG.timezone,
    standardWeeklyHours: boundedNumber(input.standardWeeklyHours, DEFAULT_TIME_POLICY_CONFIG.standardWeeklyHours, 1, 168),
    lateGraceMinutes: boundedNumber(input.lateGraceMinutes, DEFAULT_TIME_POLICY_CONFIG.lateGraceMinutes, 0, 240),
    overtimeApprovalRequired: typeof input.overtimeApprovalRequired === 'boolean' ? input.overtimeApprovalRequired : DEFAULT_TIME_POLICY_CONFIG.overtimeApprovalRequired,
    overtimeRoundingMinutes: boundedNumber(input.overtimeRoundingMinutes, DEFAULT_TIME_POLICY_CONFIG.overtimeRoundingMinutes, 1, 60),
    minimumShiftRestHours: boundedNumber(input.minimumShiftRestHours, DEFAULT_TIME_POLICY_CONFIG.minimumShiftRestHours, 0, 48),
    holidayWorkMultiplier: boundedNumber(input.holidayWorkMultiplier, DEFAULT_TIME_POLICY_CONFIG.holidayWorkMultiplier, 1, 5),
  };
}

export function timezoneOffsetMinutesForDate(timeZone: string, logicalDate: string) {
  const sample = new Date(`${logicalDate}T12:00:00.000Z`);
  if (Number.isNaN(sample.valueOf())) return 420;
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(sample);
    const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value || 0);
    const representedUtc = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'));
    return Math.round((representedUtc - sample.getTime()) / 60_000);
  } catch {
    return 420;
  }
}

export async function getTimePolicyConfig(): Promise<TimePolicyConfig> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'workforceRulesConfiguration' },
    select: { value: true },
  }).catch(() => null);
  return parseTimePolicyConfig(setting?.value);
}
