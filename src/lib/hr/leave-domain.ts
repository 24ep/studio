export const LEAVE_REQUEST_STATUSES = [
  'draft',
  'submitted',
  'pending_manager_approval',
  'pending_department_approval',
  'pending_hr_approval',
  'pending_approval',
  'returned_for_revision',
  'approved',
  'partially_approved',
  'rejected',
  'withdrawal_requested',
  'withdrawn',
  'cancellation_requested',
  'cancelled',
  'completed',
  'payroll_processed',
] as const;

export const LEAVE_ENCASHMENT_STATUSES = [
  'draft',
  'submitted',
  'pending_manager_approval',
  'pending_hr_validation',
  'pending_payroll_review',
  'approved',
  'rejected',
  'returned_for_revision',
  'reserved',
  'sent_to_payroll',
  'processing',
  'paid',
  'payment_failed',
  'reversed',
  'cancelled',
  'withdrawn',
] as const;

export type LeaveRequestUnit = 'full_day' | 'half_day' | 'hourly';
export type LeaveValidationLevel = 'passed' | 'information' | 'warning' | 'explanation_required' | 'additional_approval_required' | 'blocked';

export interface LeaveValidationResult {
  code: string;
  level: LeaveValidationLevel;
  message: string;
}

export interface LeaveCalculationInput {
  startDate: string | Date;
  endDate: string | Date;
  unit?: LeaveRequestUnit;
  requestedHours?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  timezone?: string;
  workingWeekdays?: number[];
  holidayDates?: Array<string | Date>;
  restDates?: Array<string | Date>;
  roster?: Array<{
    date: string | Date;
    startTime: string;
    endTime: string;
    status?: string;
  }>;
  hoursPerDay?: number;
  excludeHolidays?: boolean;
  excludeRestDays?: boolean;
  minimumUnits?: number;
  maximumUnits?: number | null;
  availableBalance?: number | null;
  pendingBalance?: number;
  allowNegativeBalance?: boolean;
  negativeBalanceLimit?: number | null;
}

export interface LeaveCalculationOutput {
  calendarDays: number;
  workingDays: number;
  workingHours: number;
  leaveUnits: number;
  balanceBefore: number | null;
  pendingBalance: number;
  balanceAfterApproval: number | null;
  excludedDates: Array<{ date: string; reason: 'holiday' | 'rest_day' | 'non_working_day' | 'unpublished_shift' }>;
  includedDates: Array<{ date: string; hours: number; overnight: boolean }>;
  validation: LeaveValidationResult[];
}

const DAY_MS = 86_400_000;

function isoDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(`${value}`.slice(0, 10) + 'T00:00:00.000Z');
  if (Number.isNaN(date.getTime())) throw new Error('Invalid leave date.');
  return date.toISOString().slice(0, 10);
}

function minutes(time: string) {
  const [hours, mins] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) throw new Error('Invalid shift time.');
  return hours * 60 + mins;
}

export function calculateShiftHours(startTime: string, endTime: string) {
  const start = minutes(startTime);
  let end = minutes(endTime);
  const overnight = end <= start;
  if (overnight) end += 24 * 60;
  return { hours: Math.max(0, (end - start) / 60), overnight };
}

function enumerateDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (end < start) throw new Error('End date must be on or after start date.');
  const dates: string[] = [];
  for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += DAY_MS) {
    dates.push(new Date(cursor).toISOString().slice(0, 10));
  }
  return dates;
}

function roundedUnits(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLeave(input: LeaveCalculationInput): LeaveCalculationOutput {
  const startDate = isoDate(input.startDate);
  const endDate = isoDate(input.endDate);
  const dates = enumerateDates(startDate, endDate);
  const workingWeekdays = new Set(input.workingWeekdays || [1, 2, 3, 4, 5]);
  const holidays = new Set((input.holidayDates || []).map(isoDate));
  const restDates = new Set((input.restDates || []).map(isoDate));
  const roster = new Map((input.roster || []).map(shift => [isoDate(shift.date), shift]));
  const hoursPerDay = input.hoursPerDay || 8;
  const includedDates: LeaveCalculationOutput['includedDates'] = [];
  const excludedDates: LeaveCalculationOutput['excludedDates'] = [];

  for (const date of dates) {
    const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    const shift = roster.get(date);
    if (input.excludeHolidays !== false && holidays.has(date)) {
      excludedDates.push({ date, reason: 'holiday' });
      continue;
    }
    if (input.excludeRestDays !== false && restDates.has(date)) {
      excludedDates.push({ date, reason: 'rest_day' });
      continue;
    }
    if (input.roster?.length && (!shift || shift.status === 'cancelled')) {
      excludedDates.push({ date, reason: 'unpublished_shift' });
      continue;
    }
    if (!shift && !workingWeekdays.has(day)) {
      excludedDates.push({ date, reason: 'non_working_day' });
      continue;
    }
    const duration = shift ? calculateShiftHours(shift.startTime, shift.endTime) : { hours: hoursPerDay, overnight: false };
    includedDates.push({ date, ...duration });
  }

  const unit = input.unit || 'full_day';
  let workingHours = includedDates.reduce((total, date) => total + date.hours, 0);
  let leaveUnits = includedDates.length;
  if (unit === 'half_day') {
    workingHours = includedDates.length ? includedDates[0].hours / 2 : 0;
    leaveUnits = includedDates.length ? 0.5 : 0;
  } else if (unit === 'hourly') {
    workingHours = input.requestedHours || 0;
    leaveUnits = workingHours / hoursPerDay;
  }
  leaveUnits = roundedUnits(leaveUnits);
  workingHours = roundedUnits(workingHours);

  const pendingBalance = input.pendingBalance || 0;
  const balanceBefore = input.availableBalance ?? null;
  const balanceAfterApproval = balanceBefore === null ? null : roundedUnits(balanceBefore - leaveUnits);
  const validation: LeaveValidationResult[] = [];
  if (leaveUnits <= 0) {
    validation.push({ code: 'NO_ELIGIBLE_TIME', level: 'blocked', message: 'The selected period contains no eligible working time.' });
  } else {
    validation.push({ code: 'ELIGIBLE_TIME', level: 'passed', message: `${leaveUnits} leave unit(s) are eligible.` });
  }
  if (input.minimumUnits && leaveUnits < input.minimumUnits) {
    validation.push({ code: 'MINIMUM_DURATION', level: 'blocked', message: `The minimum request is ${input.minimumUnits} unit(s).` });
  }
  if (input.maximumUnits && leaveUnits > input.maximumUnits) {
    validation.push({ code: 'MAXIMUM_DURATION', level: 'blocked', message: `The maximum request is ${input.maximumUnits} unit(s).` });
  }
  if (balanceAfterApproval !== null && balanceAfterApproval < 0) {
    const permittedLimit = input.allowNegativeBalance ? Math.abs(input.negativeBalanceLimit || 0) : 0;
    validation.push({
      code: 'BALANCE',
      level: balanceAfterApproval < -permittedLimit ? 'blocked' : 'warning',
      message: balanceAfterApproval < -permittedLimit
        ? 'The request exceeds the available balance.'
        : `Approval will create a ${Math.abs(balanceAfterApproval)} unit negative balance.`,
    });
  } else if (balanceBefore !== null) {
    validation.push({ code: 'BALANCE', level: 'passed', message: 'The available balance covers this request.' });
  }

  return {
    calendarDays: dates.length,
    workingDays: includedDates.length,
    workingHours,
    leaveUnits,
    balanceBefore,
    pendingBalance,
    balanceAfterApproval,
    excludedDates,
    includedDates,
    validation,
  };
}

export function availableLeaveBalance(balance: {
  allocated?: number | null;
  accrued?: number | null;
  carryForward?: number | null;
  used?: number | null;
  pending?: number | null;
  reserved?: number | null;
}) {
  return roundedUnits(
    Number(balance.allocated || 0)
    + Number(balance.accrued || 0)
    + Number(balance.carryForward || 0)
    - Number(balance.used || 0)
    - Number(balance.pending || 0)
    - Number(balance.reserved || 0),
  );
}

export function prorateEntitlement(annualUnits: number, eligibleFrom: string | Date, periodEnd: string | Date) {
  const start = new Date(`${isoDate(eligibleFrom)}T00:00:00.000Z`);
  const end = new Date(`${isoDate(periodEnd)}T00:00:00.000Z`);
  if (start > end) return 0;
  const yearStart = Date.UTC(end.getUTCFullYear(), 0, 1);
  const yearEnd = Date.UTC(end.getUTCFullYear(), 11, 31);
  const eligibleStart = Math.max(start.getTime(), yearStart);
  const yearDays = Math.round((yearEnd - yearStart) / DAY_MS) + 1;
  const eligibleDays = Math.round((yearEnd - eligibleStart) / DAY_MS) + 1;
  return Math.round((annualUnits * eligibleDays / yearDays) * 2) / 2;
}
