import { describe, expect, it } from 'vitest';

import { attendanceInputIdempotencyKey } from './attendance-inputs';

describe('attendanceInputIdempotencyKey', () => {
  it('is stable per export, record, component, and payroll run', () => {
    expect(attendanceInputIdempotencyKey('exp', 'record', 'OVERTIME_MINUTES', 'run')).toBe(
      'attendance-export:exp:record:OVERTIME_MINUTES:run',
    );
  });

  it('separates regular and overtime inputs', () => {
    expect(attendanceInputIdempotencyKey('exp', 'record', 'REGULAR_MINUTES', 'run')).not.toBe(
      attendanceInputIdempotencyKey('exp', 'record', 'OVERTIME_MINUTES', 'run'),
    );
  });
});
