import type {
  AttendanceCalculationInput,
  AttendanceCalculationOutput,
} from './shift-attendance-contracts';

export const ATTENDANCE_CALCULATION_VERSION = 'shift-attendance-v1';

function minutesBetween(start: Date | null, end: Date | null) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

function roundMinutes(value: number, increment: number) {
  if (increment <= 1) return Math.max(0, value);
  return Math.max(0, Math.round(value / increment) * increment);
}

export function calculateAttendance(input: AttendanceCalculationInput): AttendanceCalculationOutput {
  const calculationVersion = input.calculationVersion || ATTENDANCE_CALCULATION_VERSION;
  const scheduledMinutes = minutesBetween(input.scheduledStart, input.scheduledEnd);
  const rawWorkedMinutes = minutesBetween(input.clockIn, input.clockOut);
  const workedMinutes = roundMinutes(
    Math.max(0, rawWorkedMinutes - Math.max(0, input.breakMinutes)),
    input.roundingMinutes,
  );
  const exceptionCodes: string[] = [];
  const reasons: string[] = [];

  if (input.approvedLeave) {
    reasons.push('Approved leave covers the logical attendance date.');
    return {
      status: 'on_leave',
      scheduledMinutes,
      workedMinutes: 0,
      regularMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      paidBreakMinutes: 0,
      unpaidBreakMinutes: 0,
      holidayMinutes: 0,
      exceptionCodes,
      reasons,
      calculationVersion,
    };
  }

  if (!input.scheduledStart || !input.scheduledEnd) {
    if (!input.clockIn) reasons.push('No published shift or work schedule was found.');
    else reasons.push('Work was recorded without a published scheduled shift.');
    return {
      status: input.clockIn ? (input.workLocation === 'remote' ? 'working_remotely' : 'present') : 'not_scheduled',
      scheduledMinutes: 0,
      workedMinutes,
      regularMinutes: 0,
      overtimeMinutes: workedMinutes,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      paidBreakMinutes: 0,
      unpaidBreakMinutes: Math.max(0, input.breakMinutes),
      holidayMinutes: input.publicHoliday ? workedMinutes : 0,
      exceptionCodes: input.clockIn ? ['UNSCHEDULED_WORK'] : exceptionCodes,
      reasons,
      calculationVersion,
    };
  }

  if (!input.clockIn) {
    exceptionCodes.push('MISSING_CHECK_IN');
    reasons.push('No check-in event exists for the scheduled shift.');
    return {
      status: input.clockOut ? 'missing_record' : 'absent',
      scheduledMinutes,
      workedMinutes: 0,
      regularMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      paidBreakMinutes: 0,
      unpaidBreakMinutes: 0,
      holidayMinutes: 0,
      exceptionCodes,
      reasons,
      calculationVersion,
    };
  }

  if (!input.clockOut) {
    if (input.openBreakStartedAt) {
      reasons.push('An active break is in progress.');
      return {
        status: 'on_break',
        scheduledMinutes,
        workedMinutes: 0,
        regularMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        paidBreakMinutes: 0,
        unpaidBreakMinutes: Math.max(0, input.breakMinutes),
        holidayMinutes: 0,
        exceptionCodes,
        reasons,
        calculationVersion,
      };
    }
    exceptionCodes.push('MISSING_CHECK_OUT');
    reasons.push('A check-in exists, but the shift has no check-out event.');
    return {
      status: 'missing_record',
      scheduledMinutes,
      workedMinutes: 0,
      regularMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: Math.max(0, minutesBetween(input.scheduledStart, input.clockIn) - input.lateToleranceMinutes),
      earlyDepartureMinutes: 0,
      paidBreakMinutes: 0,
      unpaidBreakMinutes: Math.max(0, input.breakMinutes),
      holidayMinutes: 0,
      exceptionCodes,
      reasons,
      calculationVersion,
    };
  }

  const lateMinutes = Math.max(
    0,
    minutesBetween(input.scheduledStart, input.clockIn) - Math.max(0, input.lateToleranceMinutes),
  );
  const earlyDepartureMinutes = input.clockOut < input.scheduledEnd
    ? Math.max(
        0,
        minutesBetween(input.clockOut, input.scheduledEnd)
          - Math.max(0, input.earlyDepartureToleranceMinutes),
      )
    : 0;
  const regularMinutes = Math.min(scheduledMinutes, workedMinutes);
  const rawOvertime = Math.max(0, workedMinutes - scheduledMinutes);
  const overtimeMinutes = Math.min(rawOvertime, Math.max(0, input.approvedOvertimeMinutes));

  if (lateMinutes > 0) {
    exceptionCodes.push('LATE_ARRIVAL');
    reasons.push(`Check-in was ${lateMinutes} minute${lateMinutes === 1 ? '' : 's'} beyond the allowed arrival tolerance.`);
  }
  if (earlyDepartureMinutes > 0) {
    exceptionCodes.push('EARLY_DEPARTURE');
    reasons.push(`Check-out was ${earlyDepartureMinutes} minute${earlyDepartureMinutes === 1 ? '' : 's'} before the allowed departure window.`);
  }
  if (rawOvertime > input.approvedOvertimeMinutes) {
    exceptionCodes.push('UNAPPROVED_OVERTIME');
    reasons.push('Recorded work exceeds the approved overtime duration.');
  }
  if (input.publicHoliday) reasons.push('Worked time is also classified as public-holiday time.');

  const status = input.workLocation === 'remote'
    ? 'working_remotely'
    : input.workLocation === 'field'
      ? 'off_site'
      : lateMinutes > 0
        ? 'late'
        : 'checked_out';

  if (reasons.length === 0) reasons.push('Recorded events satisfy the published shift and attendance policy.');

  return {
    status,
    scheduledMinutes,
    workedMinutes,
    regularMinutes,
    overtimeMinutes,
    lateMinutes,
    earlyDepartureMinutes,
    paidBreakMinutes: 0,
    unpaidBreakMinutes: Math.max(0, input.breakMinutes),
    holidayMinutes: input.publicHoliday ? workedMinutes : 0,
    exceptionCodes,
    reasons,
    calculationVersion,
  };
}

export function resolveShiftWindow(
  logicalDate: string,
  startTime: string,
  endTime: string,
  timezoneOffsetMinutes = 420,
) {
  const [year, month, day] = logicalDate.split('-').map(Number);
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const utcOffset = timezoneOffsetMinutes * 60_000;
  const start = new Date(Date.UTC(year, month - 1, day, startHour, startMinute) - utcOffset);
  const end = new Date(Date.UTC(year, month - 1, day, endHour, endMinute) - utcOffset);
  if (end <= start) end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}
