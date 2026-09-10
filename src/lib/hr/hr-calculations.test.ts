import { describe, expect, it } from 'vitest';

import {
  calculateAverageProgress,
  calculateLeaveRemaining,
  calculatePayrollTotals,
  calculateProgressPercent,
} from './hr-calculations';

describe('hr calculations', () => {
  it('calculates remaining leave after used and pending days', () => {
    expect(calculateLeaveRemaining({ allocated: 12, used: 3.5, pending: 2 })).toBe(6.5);
  });

  it('does not return negative leave remaining', () => {
    expect(calculateLeaveRemaining({ allocated: 5, used: 6, pending: 1 })).toBe(0);
  });

  it('summarizes payroll run totals', () => {
    expect(calculatePayrollTotals([
      { grossPay: 50000, netPay: 42000, adjustments: 1000 },
      { grossPay: 45000, netPay: 38250, adjustments: -500 },
    ])).toEqual({ grossPay: 95000, netPay: 80250, adjustments: 500 });
  });

  it('calculates progress percent and handles empty totals', () => {
    expect(calculateProgressPercent({ total: 8, completed: 6 })).toBe(75);
    expect(calculateProgressPercent({ total: 0, completed: 0 })).toBe(0);
  });

  it('calculates average progress for onboarding and learning cards', () => {
    expect(calculateAverageProgress([25, 50, 100])).toBe(58);
    expect(calculateAverageProgress([])).toBe(0);
  });
});
