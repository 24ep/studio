export function periodsPerYearForFrequency(value: unknown) {
  const frequency = String(value || "monthly")
    .toLowerCase()
    .replaceAll("-", "_");
  if (["weekly", "week"].includes(frequency)) return 52;
  if (["biweekly", "bi_weekly", "fortnightly"].includes(frequency)) return 26;
  if (["semimonthly", "semi_monthly", "twice_monthly"].includes(frequency))
    return 24;
  if (["quarterly", "quarter"].includes(frequency)) return 4;
  if (["annual", "annually", "yearly"].includes(frequency)) return 1;
  return 12;
}

export function amountPerPayrollPeriod(
  amount: number,
  compensationFrequency: unknown,
  payrollFrequency: unknown,
) {
  return (
    (amount * periodsPerYearForFrequency(compensationFrequency)) /
    periodsPerYearForFrequency(payrollFrequency)
  );
}

export function runIncludesBaseSalary(runType: unknown) {
  return [
    "regular",
    "correction",
    "retroactive",
    "final",
    "termination",
    "simulation",
  ].includes(String(runType || "regular").toLowerCase());
}

export function payrollPeriodDatesAreValid(
  startDate: string,
  endDate: string,
  payDate: string,
) {
  return endDate >= startDate && payDate >= endDate;
}

export function payrollExportAllowedForRun(
  runType: unknown,
  exportType: unknown,
) {
  if (String(runType || "").toLowerCase() !== "reversal") return true;
  return String(exportType || "").toLowerCase() === "accounting";
}

export function payslipTimelineStep(input: {
  records: number;
  released: number;
  downloaded: number;
  pendingRelease: number;
}) {
  if (input.records <= 0) return 0;
  if (input.released <= 0) return 1;
  if (input.downloaded <= 0) return 2;
  if (input.pendingRelease > 0 || input.downloaded < input.records) return 3;
  return 4;
}

export function statutoryEarningBucket(code: unknown, configured?: unknown) {
  const explicit = String(configured || "").toLowerCase();
  if (
    [
      "overtime",
      "bonus",
      "allowances",
      "retroactive",
      "terminationPay",
    ].includes(explicit)
  )
    return explicit;
  const normalized = String(code || "").toUpperCase();
  if (/(^|_)OT($|_)|OVERTIME/.test(normalized)) return "overtime";
  if (/BONUS|INCENTIVE/.test(normalized)) return "bonus";
  if (/RETRO|ARREAR/.test(normalized)) return "retroactive";
  if (/TERMINATION|SEVERANCE/.test(normalized)) return "terminationPay";
  return "allowances";
}

export function compensationTransitionAllowed(action: string, status: string) {
  if (action === "submit_change") return status === "draft";
  if (["approve_change", "reject_change"].includes(action))
    return status === "pending_approval";
  return false;
}

export function benefitEnrollmentTransitionAllowed(
  action: string,
  status: string,
) {
  if (action === "approve_enrollment")
    return ["pending_approval", "returned_for_revision"].includes(status);
  if (action === "return_enrollment") return status === "pending_approval";
  if (action === "end_enrollment")
    return ["active", "approved", "scheduled"].includes(status);
  return false;
}

export type PayrollReadinessInput = {
  employees: number;
  periodConfigured: boolean;
  missingPayrollProfile: number;
  missingCompensation: number;
  missingBankDetails: number;
  missingTaxInformation: number;
  missingPayrollGroup: number;
};

const coverage = (employees: number, missing: number) =>
  employees > 0
    ? Math.round(
        (Math.max(0, employees - Math.min(employees, Math.max(0, missing))) /
          employees) *
          100,
      )
    : 0;

export function calculatePayrollReadiness(input: PayrollReadinessInput) {
  const employees = Math.max(0, Math.trunc(input.employees));
  const checks = {
    period: input.periodConfigured ? 100 : 0,
    payrollProfile: coverage(employees, input.missingPayrollProfile),
    compensation: coverage(employees, input.missingCompensation),
    payrollGroup: coverage(employees, input.missingPayrollGroup),
    bankDetails: coverage(employees, input.missingBankDetails),
    taxInformation: coverage(employees, input.missingTaxInformation),
  };
  const score = Math.round(
    checks.period * 0.1 +
      checks.payrollProfile * 0.2 +
      checks.compensation * 0.25 +
      checks.payrollGroup * 0.15 +
      checks.bankDetails * 0.15 +
      checks.taxInformation * 0.15,
  );
  return { score, checks };
}

export function payrollRunCompletion(status: unknown) {
  const completedMilestones: Record<string, number> = {
    draft: 0,
    collecting_inputs: 1,
    returned_for_correction: 1,
    calculated: 2,
    exceptions_pending: 2,
    pending_approval: 3,
    approved: 4,
    finalized: 5,
    payment_processing: 6,
    paid: 7,
    reconciliation_pending: 7,
    reconciled: 8,
    closed: 9,
    reversal_pending: 8,
    reversed: 9,
  };
  return Math.round(((completedMilestones[String(status)] ?? 0) / 9) * 100);
}
