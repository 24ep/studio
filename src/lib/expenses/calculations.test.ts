import { describe, expect, it } from 'vitest';

import {
  calculateAdvanceSettlement,
  calculateClaimTotals,
  convertMoney,
  journalBalances,
} from './calculations';

describe('expense calculations', () => {
  it('converts and rounds currency deterministically', () => {
    expect(convertMoney(10.005, 35.5)).toBe(355.18);
  });

  it('calculates reimbursement and advance offset', () => {
    expect(calculateClaimTotals([
      { originalAmount: 100, exchangeRate: 35, taxAmount: 7, reimbursable: true },
      { originalAmount: 25, exchangeRate: 35, taxAmount: 0, reimbursable: false },
    ], 1_000)).toEqual({
      claimedAmount: 4_375,
      eligibleAmount: 3_500,
      ineligibleAmount: 875,
      taxAmount: 245,
      advanceOffset: 1_000,
      employeeReimbursement: 2_500,
      employeeRepayment: 0,
    });
  });

  it('prevents settlement beyond the remaining balance', () => {
    expect(() => calculateAdvanceSettlement({
      issuedAmount: 10_000,
      previouslySettledAmount: 8_000,
      eligibleExpenseAmount: 1_500,
      returnedAmount: 600,
    })).toThrow('Settlement exceeds');
  });

  it('validates balanced journals', () => {
    expect(journalBalances([
      { debit: 1_200, credit: 0 },
      { debit: 0, credit: 1_200 },
    ])).toEqual({ debit: 1_200, credit: 1_200, balanced: true, difference: 0 });
  });
});
