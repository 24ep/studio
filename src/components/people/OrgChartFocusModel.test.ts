import { describe, expect, it } from 'vitest';

import {
  defaultFocusEmployeeId,
  employeeName,
  employeeRole,
  initials,
  type OrgChartFocusEmployee,
} from './OrgChartFocusModel';

const employee = (overrides: Partial<OrgChartFocusEmployee> = {}): OrgChartFocusEmployee => ({
  id: '1',
  firstName: 'Ava',
  lastName: 'Stone',
  email: 'ava@example.com',
  jobTitle: 'Analyst',
  ...overrides,
});

describe('OrgChartFocusModel', () => {
  it('keeps employee display fallbacks stable', () => {
    expect(employeeName(employee())).toBe('Ava Stone');
    expect(employeeName(employee({ firstName: null, lastName: null }))).toBe('ava@example.com');
    expect(employeeRole(employee({ positionTitle: 'Senior Analyst' }))).toBe('Senior Analyst');
    expect(initials(employee())).toBe('AS');
  });

  it('chooses the manager with the largest reporting span as default focus', () => {
    const employees = [
      employee({ id: 'lead', managerId: 'exec' }),
      employee({ id: 'manager-a', managerId: 'lead' }),
      employee({ id: 'manager-b', managerId: 'lead' }),
      employee({ id: 'report-a', managerId: 'manager-a' }),
      employee({ id: 'report-b', managerId: 'manager-a' }),
      employee({ id: 'report-c', managerId: 'manager-b' }),
      employee({ id: 'report-d', managerId: 'manager-a' }),
    ];

    expect(defaultFocusEmployeeId(employees)).toBe('manager-a');
  });
});
