import { describe, expect, it } from 'vitest';

import {
  buildFallbackPositions,
  employeeName,
  employeePositionId,
  employeePositionTitle,
  getPositionHeadcount,
  text,
  type EmployeeNode,
  type PositionNode,
} from './org-chart-page-model';

const employee = (overrides: Partial<EmployeeNode> = {}): EmployeeNode => ({
  id: 'employee-1',
  firstName: 'Ava',
  lastName: 'Stone',
  email: 'ava@example.com',
  ...overrides,
});

describe('org-chart-page-model', () => {
  it('preserves employee and position display fallbacks', () => {
    expect(text('', 'Fallback')).toBe('Fallback');
    expect(employeeName(employee())).toBe('Ava Stone');
    expect(employeePositionId(employee({ position_id: 'legacy-position' }))).toBe('legacy-position');
    expect(employeePositionTitle(employee({ jobTitle: 'Analyst' }))).toBe('Analyst');
  });

  it('builds fallback positions from employee assignments', () => {
    expect(buildFallbackPositions([
      employee({ id: '1', positionId: 'p1', positionTitle: 'Analyst', department: 'Data' }),
      employee({ id: '2', positionId: 'p1', positionTitle: 'Analyst', department: 'Data' }),
      employee({ id: '3', positionTitle: 'Manager', department: 'Data' }),
    ])).toEqual([
      { id: 'p1', title: 'Analyst', department: 'Data', isOpen: true },
      { id: 'position:Manager', title: 'Manager', department: 'Data', isOpen: true },
    ]);
  });

  it('uses position headcount data when present and employee counts otherwise', () => {
    const position: PositionNode = { id: 'p1', headcountData: { total: 3, filled: 2, vacant: 1 } };
    expect(getPositionHeadcount(position, [employee(), employee({ id: '2' })])).toEqual({ total: 3, filled: 2, vacant: 1 });
    expect(getPositionHeadcount({ id: 'p2' }, [employee()])).toEqual({ total: 1, filled: 1, vacant: 0 });
  });
});
