import type { ClaimItemInput } from './contracts';

export function roundMoney(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function convertMoney(amount: number, exchangeRate: number, precision = 2) {
  if (!Number.isFinite(amount) || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new Error('A valid amount and positive exchange rate are required.');
  }
  return roundMoney(amount * exchangeRate, precision);
}

export function calculateClaimTotals(
  items: Array<Pick<ClaimItemInput, 'originalAmount' | 'exchangeRate' | 'taxAmount' | 'reimbursable'>>,
  advanceBalance = 0,
) {
  const claimedAmount = roundMoney(items.reduce((total, item) => (
    total + convertMoney(item.originalAmount, item.exchangeRate)
  ), 0));
  const taxAmount = roundMoney(items.reduce((total, item) => (
    total + (item.reimbursable ? item.taxAmount * item.exchangeRate : 0)
  ), 0));
  const eligibleAmount = roundMoney(items.reduce((total, item) => (
    total + (item.reimbursable ? convertMoney(item.originalAmount, item.exchangeRate) : 0)
  ), 0));
  const advanceOffset = roundMoney(Math.min(Math.max(advanceBalance, 0), eligibleAmount));
  return {
    claimedAmount,
    eligibleAmount,
    ineligibleAmount: roundMoney(claimedAmount - eligibleAmount),
    taxAmount,
    advanceOffset,
    employeeReimbursement: roundMoney(Math.max(eligibleAmount - advanceOffset, 0)),
    employeeRepayment: roundMoney(Math.max(advanceBalance - eligibleAmount, 0)),
  };
}

export function calculateAdvanceSettlement(input: {
  issuedAmount: number;
  previouslySettledAmount: number;
  eligibleExpenseAmount: number;
  returnedAmount?: number;
}) {
  const remainingBeforeSettlement = roundMoney(
    Math.max(input.issuedAmount - input.previouslySettledAmount, 0),
  );
  const returnedAmount = roundMoney(Math.max(input.returnedAmount || 0, 0));
  const appliedToExpenses = roundMoney(
    Math.min(Math.max(input.eligibleExpenseAmount, 0), remainingBeforeSettlement),
  );
  if (appliedToExpenses + returnedAmount > remainingBeforeSettlement) {
    throw new Error('Settlement exceeds the remaining advance balance.');
  }
  const settledNow = roundMoney(appliedToExpenses + returnedAmount);
  const remainingOutstanding = roundMoney(remainingBeforeSettlement - settledNow);
  return {
    remainingBeforeSettlement,
    appliedToExpenses,
    returnedAmount,
    settledNow,
    remainingOutstanding,
    fullySettled: remainingOutstanding === 0,
  };
}

export function journalBalances(lines: Array<{ debit: number; credit: number }>) {
  const debit = roundMoney(lines.reduce((sum, line) => sum + line.debit, 0));
  const credit = roundMoney(lines.reduce((sum, line) => sum + line.credit, 0));
  return { debit, credit, balanced: debit === credit, difference: roundMoney(debit - credit) };
}
