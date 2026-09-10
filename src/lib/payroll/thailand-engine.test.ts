import { describe, expect, it } from "vitest";

import { calculateThaiPayroll, progressiveTax } from "./thailand-engine";

const employeeId = "00000000-0000-4000-8000-000000000001";

describe("Thailand payroll engine", () => {
  it("calculates progressive annual tax at bracket boundaries", () => {
    expect(progressiveTax(150000).tax).toBe(0);
    expect(progressiveTax(300000).tax).toBe(7500);
    expect(progressiveTax(500000).tax).toBe(27500);
  });

  it("caps monthly social security and returns a calculation trace", () => {
    const result = calculateThaiPayroll({
      employeeId,
      period: {
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        payDate: "2026-07-31",
        periodsPerYear: 12,
      },
      earnings: {
        baseSalary: 50000,
        overtime: 0,
        bonus: 0,
        allowances: 0,
        retroactive: 0,
        terminationPay: 0,
      },
      deductions: {
        unpaidLeave: 0,
        otherPreTax: 0,
        otherPostTax: 0,
        providentFundEmployeeRate: 0,
        providentFundEmployerRate: 0,
      },
      yearToDate: { taxableIncome: 0, pitWithheld: 0 },
      annualDeductions: 60000,
    });

    expect(result.employeeSocialSecurity).toBe(750);
    expect(result.employerSocialSecurity).toBe(750);
    expect(result.netPay).toBeGreaterThan(0);
    expect(result.authoritative).toBe(false);
    expect(result.calculationTrace.ruleSet.legalVersion).toBe(
      "TH-DRAFT-2026.1",
    );
  });

  it("includes bonus, retroactivity, termination pay, and post-tax deductions", () => {
    const result = calculateThaiPayroll({
      employeeId,
      period: {
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        payDate: "2026-07-31",
        periodsPerYear: 12,
      },
      earnings: {
        baseSalary: 30000,
        overtime: 1000,
        bonus: 10000,
        allowances: 2000,
        retroactive: -500,
        terminationPay: 5000,
      },
      deductions: {
        unpaidLeave: 500,
        otherPreTax: 250,
        otherPostTax: 300,
        providentFundEmployeeRate: 0.03,
        providentFundEmployerRate: 0.03,
      },
      yearToDate: { taxableIncome: 180000, pitWithheld: 5000 },
      annualDeductions: 60000,
    });

    expect(result.grossPay).toBe(47500);
    expect(result.providentFundEmployee).toBe(900);
    expect(result.netPay).toBeLessThan(result.grossPay);
  });

  it("applies the social-security ceiling across multiple runs in the same month", () => {
    const result = calculateThaiPayroll({
      employeeId,
      period: {
        startDate: "2026-08-15",
        endDate: "2026-08-31",
        payDate: "2026-08-31",
        periodsPerYear: 24,
        completedPeriods: 15,
      },
      earnings: {
        baseSalary: 10000,
        overtime: 0,
        bonus: 0,
        allowances: 0,
        retroactive: 0,
        terminationPay: 0,
      },
      deductions: {
        unpaidLeave: 0,
        otherPreTax: 0,
        otherPostTax: 0,
        providentFundEmployeeRate: 0,
        providentFundEmployerRate: 0,
      },
      yearToDate: { taxableIncome: 0, pitWithheld: 0 },
      annualDeductions: 60000,
      monthToDateSocialSecurityBase: 10000,
    });
    expect(result.employeeSocialSecurity).toBe(250);
    expect(result.calculationTrace.socialSecurityBase).toBe(5000);
  });

  it("projects recurring salary without paying it again in an off-cycle run", () => {
    const result = calculateThaiPayroll({
      employeeId,
      period: {
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        payDate: "2026-07-15",
        periodsPerYear: 12,
        completedPeriods: 6,
      },
      earnings: {
        baseSalary: 0,
        recurringBaseSalary: 30000,
        overtime: 0,
        bonus: 10000,
        allowances: 0,
        retroactive: 0,
        terminationPay: 0,
      },
      deductions: {
        unpaidLeave: 0,
        otherPreTax: 0,
        otherPostTax: 0,
        providentFundEmployeeRate: 0,
        providentFundEmployerRate: 0,
      },
      yearToDate: { taxableIncome: 300000, pitWithheld: 5000 },
      annualDeductions: 60000,
    });

    expect(result.grossPay).toBe(10000);
    expect(result.calculationTrace.projectedAnnualIncome).toBe(460000);
  });
});
