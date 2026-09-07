import { z } from 'zod';

export const SHIFT_VIEWS = [
  'roster',
  'attendance',
  'requests',
  'overtime',
  'timesheet',
  'reports',
] as const;

export type ShiftView = (typeof SHIFT_VIEWS)[number];

export const ROSTER_STATUSES = [
  'draft',
  'ready_for_review',
  'published',
  'partially_published',
  'changed',
  'locked',
  'archived',
] as const;

export const ATTENDANCE_STATUSES = [
  'not_scheduled',
  'scheduled',
  'present',
  'late',
  'absent',
  'on_leave',
  'working_remotely',
  'off_site',
  'on_break',
  'checked_out',
  'missing_record',
  'exception',
] as const;

export const REQUEST_STATUSES = [
  'draft',
  'submitted',
  'pending_approval',
  'awaiting_employee',
  'returned_for_revision',
  'approved',
  'rejected',
  'withdrawn',
  'cancelled',
  'applied',
] as const;

export const TIMESHEET_STATUSES = [
  'draft',
  'submitted',
  'pending_approval',
  'returned',
  'approved',
  'rejected',
  'locked',
] as const;

export const ATTENDANCE_PERIOD_STATUSES = [
  'open',
  'under_review',
  'exceptions_pending',
  'ready_to_close',
  'closed',
  'exported_to_payroll',
  'reopened',
] as const;

export const EXCEPTION_SEVERITIES = [
  'information',
  'warning',
  'explanation_required',
  'approval_required',
  'blocked',
] as const;

const uuid = z.string().uuid();
const date = z.string().date();
const dateTime = z.string().datetime({ offset: true }).or(z.string().datetime());
const optionalText = z.string().trim().max(2_000).optional().nullable();

export const shiftAttendanceMutationSchema = z.union([
  z.object({
    action: z.literal('create_assignment'),
    employeeIds: z.array(uuid).min(1).max(100).refine(
      employeeIds => new Set(employeeIds).size === employeeIds.length,
      'Employee assignments must be unique.',
    ),
    shiftDate: date,
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    scheduleId: uuid.optional().nullable(),
    shiftDefinitionId: uuid.optional().nullable(),
    openShiftId: uuid.optional().nullable(),
    workLocation: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(3).max(2_000),
  }),
  z.object({
    action: z.literal('update_assignment'),
    assignmentId: uuid,
    shiftDate: date,
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    shiftDefinitionId: uuid.optional().nullable(),
    workLocation: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(3).max(2_000),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('delete_assignment'),
    assignmentId: uuid,
    reason: z.string().trim().min(3).max(2_000),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('copy_roster'),
    sourceStart: date,
    targetStart: date,
    reason: z.string().trim().min(3).max(2_000),
  }),
  z.object({
    action: z.literal('create_roster_period'),
    name: z.string().trim().min(2).max(160),
    startDate: date,
    endDate: date,
    location: z.string().trim().max(120).optional().nullable(),
  }),
  z.object({
    action: z.literal('create_shift_definition'),
    code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
    name: z.string().trim().min(2).max(160),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    workLocation: z.string().trim().max(120).optional().nullable(),
    breakMinutes: z.coerce.number().int().min(0).max(720),
    gracePeriodMinutes: z.coerce.number().int().min(0).max(240).optional().nullable(),
  }),
  z.object({
    action: z.literal('create_work_schedule'),
    name: z.string().trim().min(2).max(160),
    weeklyHours: z.coerce.number().min(1).max(168),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    workLocation: z.string().trim().max(120).optional().nullable(),
  }),
  z.object({
    action: z.literal('create_open_shift'),
    shiftDate: date,
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    workLocation: z.string().trim().min(1).max(120),
    headcountRequired: z.coerce.number().int().min(1).max(100),
    shiftDefinitionId: uuid.optional().nullable(),
  }),
  z.object({
    action: z.literal('publish_roster'),
    rosterPeriodId: uuid,
    reason: z.string().trim().min(3).max(2_000),
  }),
  z.object({
    action: z.literal('recalculate_attendance'),
    attendanceRecordId: uuid,
    reason: z.string().trim().min(3).max(2_000),
  }),
  z.object({
    action: z.literal('review_attendance'),
    attendanceRecordId: uuid,
    decision: z.enum(['mark_for_review', 'hold', 'close']),
    reason: z.string().trim().min(3).max(2_000),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('close_period'),
    attendancePeriodId: uuid,
    reason: z.string().trim().min(3).max(2_000),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('reopen_period'),
    attendancePeriodId: uuid,
    reason: z.string().trim().min(3).max(2_000),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('export_payroll'),
    attendancePeriodId: uuid,
    reason: z.string().trim().min(3).max(2_000),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('create_shift_request'),
    requestType: z.enum([
      'shift_change',
      'shift_swap',
      'open_shift',
      'temporary_schedule_change',
      'work_location_change',
      'rest_day_change',
      'drop_shift',
      'cover_shift',
      'availability_update',
    ]),
    assignmentId: uuid.optional().nullable(),
    requestedAssignmentId: uuid.optional().nullable(),
    openShiftId: uuid.optional().nullable(),
    swapEmployeeId: uuid.optional().nullable(),
    effectiveStart: date,
    effectiveEnd: date,
    workLocation: z.string().trim().max(120).optional().nullable(),
    reason: z.string().trim().min(3).max(2_000),
    saveAsDraft: z.boolean().default(false),
  }).refine(
    value => value.requestType !== 'shift_swap' || Boolean(value.swapEmployeeId),
    { message: 'Select a colleague for a shift swap.', path: ['swapEmployeeId'] },
  ),
  z.object({
    action: z.literal('decide_shift_request'),
    requestId: uuid,
    decision: z.enum(['approve', 'reject', 'return_for_revision', 'accept_swap']),
    comment: optionalText,
    expectedVersion: z.coerce.number().int().positive(),
  }).refine(
    value => !['reject', 'return_for_revision'].includes(value.decision) || Boolean(value.comment?.trim()),
    { message: 'A comment is required for this decision.', path: ['comment'] },
  ),
  z.object({
    action: z.literal('create_overtime'),
    date,
    assignmentId: uuid.optional().nullable(),
    startAt: dateTime,
    endAt: dateTime,
    breakMinutes: z.coerce.number().int().min(0).max(720).default(0),
    overtimeType: z.enum([
      'pre_shift',
      'post_shift',
      'rest_day',
      'public_holiday',
      'emergency',
      'planned',
      'unplanned',
      'compensatory_time',
    ]),
    reason: z.string().trim().min(3).max(2_000),
    project: z.string().trim().max(160).optional().nullable(),
    costCenter: z.string().trim().max(120).optional().nullable(),
    workLocation: z.string().trim().max(120).optional().nullable(),
    compensationMethod: z.enum(['paid', 'compensatory_leave', 'time_off_in_lieu', 'none', 'mixed']),
    saveAsDraft: z.boolean().default(false),
  }).refine(value => new Date(value.endAt) > new Date(value.startAt), {
    message: 'Overtime end must be after its start.',
    path: ['endAt'],
  }),
  z.object({
    action: z.literal('decide_overtime'),
    overtimeId: uuid,
    decision: z.enum(['approve', 'reject', 'return_for_revision', 'confirm_actual']),
    approvedStartAt: dateTime.optional().nullable(),
    approvedEndAt: dateTime.optional().nullable(),
    confirmedMinutes: z.coerce.number().int().min(0).max(1_440).optional().nullable(),
    comment: optionalText,
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('save_timesheet_entry'),
    timesheetId: uuid.optional().nullable(),
    entryId: uuid.optional().nullable(),
    workDate: date,
    project: z.string().trim().min(1).max(160),
    task: z.string().trim().max(160).optional().nullable(),
    client: z.string().trim().max(160).optional().nullable(),
    costCenter: z.string().trim().max(120).optional().nullable(),
    workType: z.string().trim().max(120).optional().nullable(),
    startAt: dateTime.optional().nullable(),
    endAt: dateTime.optional().nullable(),
    durationMinutes: z.coerce.number().int().min(1).max(1_440),
    billable: z.boolean().default(false),
    description: z.string().trim().min(3).max(4_000),
    workLocation: z.string().trim().max(120).optional().nullable(),
  }),
  z.object({
    action: z.literal('delete_timesheet_entry'),
    entryId: uuid,
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('submit_timesheet'),
    timesheetId: uuid,
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('decide_timesheet'),
    timesheetId: uuid,
    decision: z.enum(['approve', 'reject', 'return']),
    comment: optionalText,
    expectedVersion: z.coerce.number().int().positive(),
  }).refine(
    value => value.decision === 'approve' || Boolean(value.comment?.trim()),
    { message: 'A comment is required when returning or rejecting a timesheet.', path: ['comment'] },
  ),
  z.object({
    action: z.literal('update_shift_request'),
    requestId: uuid,
    requestType: z.enum(['shift_change','shift_swap','open_shift','temporary_schedule_change','work_location_change','rest_day_change','drop_shift','cover_shift','availability_update']),
    assignmentId: uuid.optional().nullable(),
    requestedAssignmentId: uuid.optional().nullable(),
    openShiftId: uuid.optional().nullable(),
    swapEmployeeId: uuid.optional().nullable(),
    effectiveStart: date,
    effectiveEnd: date,
    workLocation: z.string().trim().max(120).optional().nullable(),
    reason: z.string().trim().min(3).max(2_000),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({ action: z.literal('submit_shift_request'), requestId: uuid, expectedVersion: z.coerce.number().int().positive() }),
  z.object({ action: z.literal('withdraw_shift_request'), requestId: uuid, expectedVersion: z.coerce.number().int().positive() }),
  z.object({ action: z.literal('cancel_shift_request'), requestId: uuid, expectedVersion: z.coerce.number().int().positive() }),
  z.object({ action: z.literal('resubmit_shift_request'), requestId: uuid, expectedVersion: z.coerce.number().int().positive() }),
  z.object({
    action: z.literal('update_overtime'), overtimeId: uuid, date, assignmentId: uuid.optional().nullable(),
    startAt: dateTime, endAt: dateTime, breakMinutes: z.coerce.number().int().min(0).max(720).default(0),
    overtimeType: z.enum(['pre_shift','post_shift','rest_day','public_holiday','emergency','planned','unplanned','compensatory_time']),
    reason: z.string().trim().min(3).max(2_000), project: z.string().trim().max(160).optional().nullable(),
    costCenter: z.string().trim().max(120).optional().nullable(), workLocation: z.string().trim().max(120).optional().nullable(),
    compensationMethod: z.enum(['paid','compensatory_leave','time_off_in_lieu','none','mixed']),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({ action: z.literal('submit_overtime'), overtimeId: uuid, expectedVersion: z.coerce.number().int().positive() }),
  z.object({ action: z.literal('withdraw_overtime'), overtimeId: uuid, expectedVersion: z.coerce.number().int().positive() }),
  z.object({ action: z.literal('cancel_overtime'), overtimeId: uuid, expectedVersion: z.coerce.number().int().positive() }),
  z.object({ action: z.literal('resubmit_overtime'), overtimeId: uuid, expectedVersion: z.coerce.number().int().positive() }),
]);

export type ShiftAttendanceMutation = z.infer<typeof shiftAttendanceMutationSchema>;

export interface AttendanceCalculationInput {
  logicalDate: string;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  clockIn: Date | null;
  clockOut: Date | null;
  breakMinutes: number;
  approvedLeave: boolean;
  publicHoliday: boolean;
  lateToleranceMinutes: number;
  earlyDepartureToleranceMinutes: number;
  roundingMinutes: number;
  approvedOvertimeMinutes: number;
  workLocation?: string | null;
  openBreakStartedAt?: Date | null;
  calculationVersion?: string;
}

export interface AttendanceCalculationOutput {
  status: (typeof ATTENDANCE_STATUSES)[number];
  scheduledMinutes: number;
  workedMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  paidBreakMinutes: number;
  unpaidBreakMinutes: number;
  holidayMinutes: number;
  exceptionCodes: string[];
  reasons: string[];
  calculationVersion: string;
}
