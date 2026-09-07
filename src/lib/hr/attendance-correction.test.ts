import { describe, expect, it } from 'vitest';

import { mergeAttendanceCorrection } from './attendance-correction';

const current = {
  clockIn: '2026-08-23T02:00:00.000Z',
  clockOut: '2026-08-23T10:00:00.000Z',
  breakMinutes: 60,
  workLocation: 'office',
  status: 'present',
  assignmentId: '11111111-1111-4111-8111-111111111111',
};

describe('mergeAttendanceCorrection', () => {
  it('preserves check-in when only checkout is corrected', () => {
    expect(mergeAttendanceCorrection(current, {
      correctionType: 'incorrect_check_out',
      clockOut: '2026-08-23T11:00:00.000Z',
    })).toEqual({ ...current, clockOut: '2026-08-23T11:00:00.000Z' });
  });

  it('preserves clocks when only break is corrected', () => {
    expect(mergeAttendanceCorrection(current, {
      correctionType: 'incorrect_break',
      breakMinutes: 30,
    })).toEqual({ ...current, breakMinutes: 30 });
  });

  it('maps work from home correction to remote attendance', () => {
    expect(mergeAttendanceCorrection(current, {
      correctionType: 'work_from_home_correction',
    })).toEqual({ ...current, workLocation: 'remote', status: 'working_remotely' });
  });

  it('requires a replacement assignment for incorrect shift assignment', () => {
    expect(() => mergeAttendanceCorrection(current, {
      correctionType: 'incorrect_shift_assignment',
    })).toThrow('replacement shift assignment');
  });
});
