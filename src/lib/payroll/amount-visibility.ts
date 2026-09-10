import type { PayrollWorkspacePayload } from './contracts';

const monetaryKeys = new Set([
  'amount', 'approved_amount', 'base_salary', 'current_amount', 'proposed_amount',
  'gross', 'gross_pay', 'gross_total', 'prior_gross', 'net', 'net_pay', 'net_total',
  'prior_net', 'deductions', 'total_deductions', 'prior_deductions', 'employer_cost',
  'employee_cost', 'employer_contribution', 'employer_contributions',
  'prior_employer_contributions', 'contribution', 'debit', 'credit', 'total_debit',
  'total_credit', 'budget_impact', 'taxable_income', 'pit_withholding',
  'employee_social_security', 'employer_social_security', 'reimbursement_amount',
  'repayment_amount', 'payment_total', 'payslip_total', 'calculation_total',
]);

function shouldMask(key: string): boolean {
  const normalized = key.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`).toLowerCase();
  return monetaryKeys.has(normalized) ||
    /(^|_)(salary|gross|net|deduction|contribution|debit|credit|taxable_income|withholding)$/.test(normalized) ||
    /(^|_)(amount|cost|pay|total)$/.test(normalized);
}

function maskRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]): [string, unknown] => {
      if (shouldMask(key)) return [key, null];
      if (Array.isArray(value)) {
        return [key, value.map(item => item && typeof item === 'object' && !Array.isArray(item)
          ? maskRecord(item as Record<string, unknown>)
          : item)];
      }
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        return [key, maskRecord(value as Record<string, unknown>)];
      }
      return [key, value];
    }),
  );
}

export function applyPayrollAmountVisibility(
  payload: PayrollWorkspacePayload,
  canViewAmounts: boolean,
): PayrollWorkspacePayload {
  const access = { ...payload.access, canViewAmounts };
  if (canViewAmounts) return { ...payload, access };

  return {
    ...payload,
    access,
    summary: {
      ...maskRecord(payload.summary),
      amountVisibility: 'restricted',
    },
    records: payload.records.map(maskRecord),
    secondary: payload.secondary.map(maskRecord),
    issues: payload.issues.map(maskRecord),
    // Period/group/employee identity metadata is required for workflow navigation
    // and is intentionally not treated as payroll monetary output.
    periods: payload.periods,
    groups: payload.groups,
    employees: payload.employees,
  };
}
