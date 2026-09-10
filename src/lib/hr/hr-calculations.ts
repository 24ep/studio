export interface LeaveBalanceInput {
  allocated: number;
  used: number;
  pending: number;
  accrued?: number;
  carryForward?: number;
  reserved?: number;
}

export interface PayrollRunItemInput {
  grossPay: number;
  netPay: number;
  adjustments: number;
}

export interface ProgressInput {
  total: number;
  completed: number;
}

export function calculateLeaveRemaining(balance: LeaveBalanceInput) {
  return Math.max(
    0,
    balance.allocated
      + (balance.accrued || 0)
      + (balance.carryForward || 0)
      - balance.used
      - balance.pending
      - (balance.reserved || 0),
  );
}

export function calculatePayrollTotals(items: PayrollRunItemInput[]) {
  return items.reduce(
    (totals, item) => ({
      grossPay: totals.grossPay + item.grossPay,
      netPay: totals.netPay + item.netPay,
      adjustments: totals.adjustments + item.adjustments,
    }),
    { grossPay: 0, netPay: 0, adjustments: 0 },
  );
}

export function calculateProgressPercent(input: ProgressInput) {
  if (input.total <= 0) return 0;
  return Math.round((input.completed / input.total) * 100);
}

export function calculateAverageProgress(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
