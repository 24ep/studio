import { describe, expect, it } from 'vitest';

import { timeMutationEmployeeIds, timeNotificationHref } from './shift-notification-recipients';

describe('timeMutationEmployeeIds', () => {
  it('collects unique employee ids from a bulk roster result', () => {
    expect(timeMutationEmployeeIds({
      assignments: [
        { employee_id: 'employee-a' },
        { employee_id: 'employee-b' },
        { employee_id: 'employee-a' },
      ],
    })).toEqual(['employee-a', 'employee-b']);
  });

  it('routes employee notifications to ESS', () => {
    expect(timeNotificationHref('publish_roster')).toBe('/ess/attendance');
    expect(timeNotificationHref('decide_overtime')).toBe('/ess/overtime');
  });
});
