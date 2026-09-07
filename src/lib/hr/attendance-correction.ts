export const ATTENDANCE_CORRECTION_TYPES = [
  'missing_check_in',
  'missing_check_out',
  'incorrect_check_in',
  'incorrect_check_out',
  'missing_break',
  'incorrect_break',
  'incorrect_attendance_status',
  'work_from_home_correction',
  'off_site_work_correction',
  'incorrect_shift_assignment',
] as const;

export type AttendanceCorrectionType = (typeof ATTENDANCE_CORRECTION_TYPES)[number];

export type AttendanceCorrectionValues = {
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  workLocation: string | null;
  status: string | null;
  assignmentId: string | null;
};

export type AttendanceCorrectionPatch = {
  correctionType: AttendanceCorrectionType;
  clockIn?: string | null;
  clockOut?: string | null;
  breakMinutes?: number | null;
  workLocation?: string | null;
  requestedStatus?: string | null;
  assignmentId?: string | null;
};

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined || value === '') throw new Error(message);
  return value;
}

export function mergeAttendanceCorrection(
  current: AttendanceCorrectionValues,
  patch: AttendanceCorrectionPatch,
): AttendanceCorrectionValues {
  const next = { ...current };

  switch (patch.correctionType) {
    case 'missing_check_in':
    case 'incorrect_check_in':
      next.clockIn = required(patch.clockIn, 'A corrected check-in time is required.');
      break;
    case 'missing_check_out':
    case 'incorrect_check_out':
      next.clockOut = required(patch.clockOut, 'A corrected check-out time is required.');
      break;
    case 'missing_break':
    case 'incorrect_break':
      next.breakMinutes = Number(required(patch.breakMinutes, 'Corrected break minutes are required.'));
      break;
    case 'incorrect_attendance_status':
      next.status = required(patch.requestedStatus, 'A corrected attendance status is required.');
      break;
    case 'work_from_home_correction':
      next.workLocation = patch.workLocation || 'remote';
      next.status = 'working_remotely';
      break;
    case 'off_site_work_correction':
      next.workLocation = patch.workLocation || 'field';
      next.status = 'off_site';
      break;
    case 'incorrect_shift_assignment':
      next.assignmentId = required(patch.assignmentId, 'A replacement shift assignment is required.');
      break;
  }

  if (next.clockIn && next.clockOut && new Date(next.clockOut) <= new Date(next.clockIn)) {
    throw new Error('Check-out must be after check-in.');
  }
  if (!Number.isInteger(next.breakMinutes) || next.breakMinutes < 0 || next.breakMinutes > 720) {
    throw new Error('Break minutes must be between 0 and 720.');
  }

  return next;
}
