import { z } from "zod";

export const thaiPayrollInputSchema = z.object({
  employeeId: z.string().uuid(),
  period: z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
    payDate: z.string().date(),
    periodsPerYear: z.number().int().min(1).max(365).default(12),
    completedPeriods: z.number().int().min(0).max(364).default(0),
  }),
  earnings: z.object({
    baseSalary: z.number().min(0),
    recurringBaseSalary: z.number().min(0).optional(),
    overtime: z.number().min(0).default(0),
    bonus: z.number().min(0).default(0),
    allowances: z.number().min(0).default(0),
    retroactive: z.number().default(0),
    terminationPay: z.number().min(0).default(0),
  }),
  deductions: z.object({
    unpaidLeave: z.number().min(0).default(0),
    otherPreTax: z.number().min(0).default(0),
    otherPostTax: z.number().min(0).default(0),
    providentFundEmployeeRate: z.number().min(0).max(0.15).default(0),
    providentFundEmployerRate: z.number().min(0).max(0.15).default(0),
  }),
  yearToDate: z
    .object({
      taxableIncome: z.number().min(0).default(0),
      pitWithheld: z.number().min(0).default(0),
    })
    .default({ taxableIncome: 0, pitWithheld: 0 }),
  annualDeductions: z.number().min(0).default(60000),
  monthToDateSocialSecurityBase: z.number().min(0).default(0),
});

export type ThaiPayrollInput = z.input<typeof thaiPayrollInputSchema>;

export interface ThaiPayrollRuleSet {
  legalVersion: string;
  effectiveFrom: string;
  employeeSocialSecurityRate: number;
  employerSocialSecurityRate: number;
  socialSecurityMonthlyWageCeiling: number;
  taxBrackets: Array<{ upTo: number | null; rate: number }>;
  roundingDecimals: number;
  authoritative?: boolean;
}

export const defaultThaiPayrollRules: ThaiPayrollRuleSet = {
  legalVersion: "TH-DRAFT-2026.1",
  effectiveFrom: "2026-01-01",
  employeeSocialSecurityRate: 0.05,
  employerSocialSecurityRate: 0.05,
  socialSecurityMonthlyWageCeiling: 15000,
  taxBrackets: [
    { upTo: 150000, rate: 0 },
    { upTo: 300000, rate: 0.05 },
    { upTo: 500000, rate: 0.1 },
    { upTo: 750000, rate: 0.15 },
    { upTo: 1000000, rate: 0.2 },
    { upTo: 2000000, rate: 0.25 },
    { upTo: 5000000, rate: 0.3 },
    { upTo: null, rate: 0.35 },
  ],
  roundingDecimals: 2,
};

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function progressiveTax(
  annualTaxableIncome: number,
  rules = defaultThaiPayrollRules,
) {
  let previousLimit = 0;
  let remaining = Math.max(0, annualTaxableIncome);
  let tax = 0;
  const trace: Array<{
    from: number;
    to: number | null;
    rate: number;
    taxable: number;
    tax: number;
  }> = [];

  for (const bracket of rules.taxBrackets) {
    const capacity =
      bracket.upTo === null
        ? remaining
        : Math.max(0, bracket.upTo - previousLimit);
    const taxable = Math.min(remaining, capacity);
    const bracketTax = taxable * bracket.rate;
    trace.push({
      from: previousLimit,
      to: bracket.upTo,
      rate: bracket.rate,
      taxable: round(taxable),
      tax: round(bracketTax),
    });
    tax += bracketTax;
    remaining -= taxable;
    if (remaining <= 0) break;
    previousLimit = bracket.upTo ?? previousLimit;
  }

  return { tax: round(tax, rules.roundingDecimals), trace };
}

export function calculateThaiPayroll(
  raw: ThaiPayrollInput,
  rules = defaultThaiPayrollRules,
) {
  const input = thaiPayrollInputSchema.parse(raw);
  const grossPay =
    input.earnings.baseSalary +
    input.earnings.overtime +
    input.earnings.bonus +
    input.earnings.allowances +
    input.earnings.retroactive +
    input.earnings.terminationPay;
  const socialSecurityBase = Math.min(
    Math.max(
      0,
      grossPay - input.earnings.bonus - input.earnings.terminationPay,
    ),
    Math.max(
      0,
      rules.socialSecurityMonthlyWageCeiling -
        input.monthToDateSocialSecurityBase,
    ),
  );
  const employeeSocialSecurity = round(
    socialSecurityBase * rules.employeeSocialSecurityRate,
    rules.roundingDecimals,
  );
  const employerSocialSecurity = round(
    socialSecurityBase * rules.employerSocialSecurityRate,
    rules.roundingDecimals,
  );
  const providentFundEmployee = round(
    input.earnings.baseSalary * input.deductions.providentFundEmployeeRate,
    rules.roundingDecimals,
  );
  const providentFundEmployer = round(
    input.earnings.baseSalary * input.deductions.providentFundEmployerRate,
    rules.roundingDecimals,
  );
  const currentTaxableIncome = Math.max(
    0,
    grossPay -
      input.deductions.unpaidLeave -
      input.deductions.otherPreTax -
      employeeSocialSecurity -
      providentFundEmployee,
  );
  const remainingPeriods = Math.max(
    1,
    input.period.periodsPerYear - input.period.completedPeriods,
  );
  const projectedAnnualIncome =
    input.yearToDate.taxableIncome +
    currentTaxableIncome +
    Math.max(0, remainingPeriods - 1) *
      Math.max(
        0,
        (input.earnings.recurringBaseSalary ?? input.earnings.baseSalary) -
          employeeSocialSecurity -
          providentFundEmployee,
      );
  const annualTaxableIncome = Math.max(
    0,
    projectedAnnualIncome - input.annualDeductions,
  );
  const annualTax = progressiveTax(annualTaxableIncome, rules);
  const pitWithholding = round(
    Math.max(
      0,
      (annualTax.tax - input.yearToDate.pitWithheld) / remainingPeriods,
    ),
    rules.roundingDecimals,
  );
  const totalEmployeeDeductions =
    input.deductions.unpaidLeave +
    input.deductions.otherPreTax +
    input.deductions.otherPostTax +
    employeeSocialSecurity +
    providentFundEmployee +
    pitWithholding;
  const netPay = round(
    Math.max(0, grossPay - totalEmployeeDeductions),
    rules.roundingDecimals,
  );

  return {
    jurisdiction: "TH",
    legalVersion: rules.legalVersion,
    authoritative: Boolean(rules.authoritative),
    reviewNotice: rules.authoritative
      ? "Calculated using the organization-approved statutory rule set."
      : "Draft statutory rules require approval by a qualified Thai payroll or legal reviewer before production use.",
    grossPay: round(grossPay),
    taxableIncome: round(currentTaxableIncome),
    pitWithholding,
    employeeSocialSecurity,
    employerSocialSecurity,
    providentFundEmployee,
    providentFundEmployer,
    totalEmployeeDeductions: round(totalEmployeeDeductions),
    employerCost: round(
      grossPay + employerSocialSecurity + providentFundEmployer,
    ),
    netPay,
    components: {
      earnings: input.earnings,
      deductions: input.deductions,
    },
    calculationTrace: {
      ruleSet: rules,
      socialSecurityBase: round(socialSecurityBase),
      projectedAnnualIncome: round(projectedAnnualIncome),
      completedPeriods: input.period.completedPeriods,
      remainingPeriods,
      annualDeductions: input.annualDeductions,
      annualTaxableIncome: round(annualTaxableIncome),
      annualTax: annualTax.tax,
      taxBrackets: annualTax.trace,
    },
  };
}
