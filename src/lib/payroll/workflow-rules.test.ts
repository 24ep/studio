import { describe, expect, it } from "vitest";
import {
  amountPerPayrollPeriod,
  benefitEnrollmentTransitionAllowed,
  calculatePayrollReadiness,
  compensationTransitionAllowed,
  periodsPerYearForFrequency,
  payrollRunCompletion,
  payrollExportAllowedForRun,
  payrollPeriodDatesAreValid,
  payslipTimelineStep,
  runIncludesBaseSalary,
  statutoryEarningBucket,
} from "./workflow-rules";

describe("payroll workflow rules", () => {
  it.each([
    ["weekly", 52],
    ["bi-weekly", 26],
    ["semi_monthly", 24],
    ["monthly", 12],
    ["quarterly", 4],
    ["annual", 1],
  ])("maps %s to %i payroll periods", (frequency, expected) => {
    expect(periodsPerYearForFrequency(frequency)).toBe(expected);
  });

  it("allows only valid compensation transitions", () => {
    expect(compensationTransitionAllowed("submit_change", "draft")).toBe(true);
    expect(
      compensationTransitionAllowed("approve_change", "pending_approval"),
    ).toBe(true);
    expect(compensationTransitionAllowed("approve_change", "approved")).toBe(
      false,
    );
    expect(compensationTransitionAllowed("reject_change", "draft")).toBe(false);
  });

  it("converts compensation amounts to the payroll group frequency", () => {
    expect(amountPerPayrollPeriod(52000, "annual", "monthly")).toBeCloseTo(
      4333.33,
      2,
    );
    expect(amountPerPayrollPeriod(10000, "monthly", "weekly")).toBeCloseTo(
      2307.69,
      2,
    );
    expect(amountPerPayrollPeriod(10000, "monthly", "monthly")).toBe(10000);
  });

  it("excludes base salary from supplemental run types", () => {
    expect(runIncludesBaseSalary("regular")).toBe(true);
    expect(runIncludesBaseSalary("termination")).toBe(true);
    expect(runIncludesBaseSalary("bonus")).toBe(false);
    expect(runIncludesBaseSalary("off_cycle")).toBe(false);
  });

  it("requires the pay date to be on or after the period end", () => {
    expect(
      payrollPeriodDatesAreValid("2026-08-01", "2026-08-31", "2026-08-31"),
    ).toBe(true);
    expect(
      payrollPeriodDatesAreValid("2026-08-01", "2026-08-31", "2026-08-25"),
    ).toBe(false);
    expect(
      payrollPeriodDatesAreValid("2026-08-31", "2026-08-01", "2026-08-31"),
    ).toBe(false);
  });

  it("limits reversal runs to accounting correction exports", () => {
    expect(payrollExportAllowedForRun("regular", "bank")).toBe(true);
    expect(payrollExportAllowedForRun("reversal", "accounting")).toBe(true);
    expect(payrollExportAllowedForRun("reversal", "bank")).toBe(false);
    expect(payrollExportAllowedForRun("reversal", "statutory")).toBe(false);
    expect(payrollExportAllowedForRun("reversal", "sso")).toBe(false);
  });

  it("does not complete payslip milestones when there are no documents", () => {
    expect(
      payslipTimelineStep({
        records: 0,
        released: 0,
        downloaded: 0,
        pendingRelease: 0,
      }),
    ).toBe(0);
    expect(
      payslipTimelineStep({
        records: 2,
        released: 2,
        downloaded: 0,
        pendingRelease: 0,
      }),
    ).toBe(2);
    expect(
      payslipTimelineStep({
        records: 2,
        released: 2,
        downloaded: 2,
        pendingRelease: 0,
      }),
    ).toBe(4);
  });

  it("classifies statutory earning components", () => {
    expect(statutoryEarningBucket("OT_WEEKDAY")).toBe("overtime");
    expect(statutoryEarningBucket("ANNUAL_BONUS")).toBe("bonus");
    expect(statutoryEarningBucket("SEVERANCE")).toBe("terminationPay");
    expect(statutoryEarningBucket("CUSTOM", "retroactive")).toBe("retroactive");
  });

  it("prevents reopening ended benefit coverage through approval", () => {
    expect(benefitEnrollmentTransitionAllowed("end_enrollment", "active")).toBe(
      true,
    );
    expect(
      benefitEnrollmentTransitionAllowed("approve_enrollment", "ended"),
    ).toBe(false);
    expect(
      benefitEnrollmentTransitionAllowed("return_enrollment", "active"),
    ).toBe(false);
  });
});

describe("payroll readiness", () => {
  it("calculates weighted readiness from actual setup coverage", () => {
    const result = calculatePayrollReadiness({
      employees: 10,
      periodConfigured: true,
      missingPayrollProfile: 2,
      missingCompensation: 1,
      missingPayrollGroup: 2,
      missingBankDetails: 4,
      missingTaxInformation: 0,
    });
    expect(result.checks.payrollProfile).toBe(80);
    expect(result.checks.bankDetails).toBe(60);
    expect(result.score).toBe(85);
  });

  it("does not report an empty payroll population as ready", () => {
    expect(
      calculatePayrollReadiness({
        employees: 0,
        periodConfigured: false,
        missingPayrollProfile: 0,
        missingCompensation: 0,
        missingPayrollGroup: 0,
        missingBankDetails: 0,
        missingTaxInformation: 0,
      }).score,
    ).toBe(0);
  });

  it("derives run completion from completed workflow milestones", () => {
    expect(payrollRunCompletion("draft")).toBe(0);
    expect(payrollRunCompletion("finalized")).toBe(56);
    expect(payrollRunCompletion("closed")).toBe(100);
    expect(payrollRunCompletion("reversal_pending")).toBe(89);
  });
});
