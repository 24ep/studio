import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { calculatePayroll } from "./calculation-engine";
import { calculateThaiPayroll } from "./thailand-engine";
import { getPayrollOperationsConfig } from "../payroll-approval-route-config";
import { maskPayrollReference } from "./permissions";
import { toSqlDate } from "./date-only";
import { amountPerPayrollPeriod, periodsPerYearForFrequency, runIncludesBaseSalary, statutoryEarningBucket } from "./workflow-rules";
import { PayrollServiceError, number } from "./service-foundation";
import { benefits } from "./workspace-queries";

type Db = Prisma.TransactionClient | typeof prisma;
type Row = Record<string, unknown>;

export async function collectInputs(client: Db, run: Row, actorId: string) {
  const runId = String(run.id);
  const companyId = run.company_id ? String(run.company_id) : null;
  const period = await client.$queryRawUnsafe<Row[]>(
    `SELECT start_date, end_date FROM hr_payroll_periods WHERE id = $1::uuid LIMIT 1`,
    String(run.period_id),
  );
  if (!period[0]) {
    throw new PayrollServiceError(
      "PERIOD_NOT_FOUND",
      "Payroll inputs cannot be collected because this run has no payroll period. Select a valid period and try again.",
      409,
    );
  }
  const start = toSqlDate(period[0]?.start_date);
  const end = toSqlDate(period[0]?.end_date);

  await client.$executeRawUnsafe(
    `INSERT INTO hr_payroll_inputs
      (id, company_id, payroll_run_id, employee_id, input_type, component_code, amount, currency,
       source_module, source_record_id, effective_date, approval_status, status, idempotency_key, created_by_id)
     SELECT gen_random_uuid(), claim.company_id, $1::uuid, claim.employee_id, 'earning', 'EXPENSE_REIMBURSEMENT',
            claim.employee_reimbursement, claim.reimbursement_currency, 'expenses', claim.id::text,
            claim.period_end, 'approved', 'ready', concat('expense-claim:', claim.id::text, ':', $1), $2::uuid
     FROM expense_claims claim
     WHERE claim.status = 'approved' AND claim.employee_reimbursement > 0
       AND claim.period_end BETWEEN $3::date AND $4::date
       AND ($5::uuid IS NULL OR claim.company_id = $5::uuid)
     ON CONFLICT (company_id, idempotency_key) DO NOTHING`,
    runId,
    actorId,
    start,
    end,
    companyId,
  );
  await client.$executeRawUnsafe(
    `UPDATE hr_payroll_inputs SET payroll_run_id = $1::uuid, updated_at = now()
     WHERE payroll_run_id IS NULL AND approval_status = 'approved' AND status = 'ready'
       AND effective_date BETWEEN $2::date AND $3::date
       AND ($4::uuid IS NULL OR company_id = $4::uuid)`,
    runId,
    start,
    end,
    companyId,
  );
  return client.$queryRawUnsafe<Row[]>(
    `UPDATE hr_payroll_runs SET status = 'collecting_inputs', version = version + 1, updated_at = now()
     WHERE id = $1::uuid RETURNING *`,
    runId,
  );
}

export async function calculateRun(client: Db, run: Row) {
  const runId = String(run.id);
  const companyId = run.company_id ? String(run.company_id) : null;
  const nextVersion = number(run.calculation_version) + 1;
  const operations = await getPayrollOperationsConfig();
  const varianceThreshold = operations.varianceReviewThresholdPercent ?? 10;
  const statutoryRules = {
    enabled: operations.statutoryRules?.enabled ?? false,
    legalVersion: operations.statutoryRules?.legalVersion ?? "CONFIGURE_ME",
    reviewerName: operations.statutoryRules?.reviewerName ?? "",
    reviewedAt: operations.statutoryRules?.reviewedAt ?? null,
    effectiveFrom: operations.statutoryRules?.effectiveFrom ?? "9999-12-31",
    employeeSocialSecurityRate:
      operations.statutoryRules?.employeeSocialSecurityRate ?? 0,
    employerSocialSecurityRate:
      operations.statutoryRules?.employerSocialSecurityRate ?? 0,
    socialSecurityMonthlyWageCeiling:
      operations.statutoryRules?.socialSecurityMonthlyWageCeiling ?? 1,
    annualDeductions: operations.statutoryRules?.annualDeductions ?? 0,
    taxBrackets: operations.statutoryRules?.taxBrackets ?? [
      { upTo: null, rate: 0 },
    ],
  };
  const periods = await client.$queryRawUnsafe<Row[]>(
    `SELECT period.start_date, period.end_date, period.pay_date, COALESCE(payroll_group.pay_frequency, 'monthly') pay_frequency
       FROM hr_payroll_periods period
       LEFT JOIN hr_payroll_groups payroll_group ON payroll_group.id = COALESCE($2::uuid, period.payroll_group_id)
      WHERE period.id = $1::uuid LIMIT 1`,
    String(run.period_id),
    run.payroll_group_id || null,
  );
  const period = periods[0];
  if (!period)
    throw new PayrollServiceError(
      "PERIOD_NOT_FOUND",
      "Payroll period was not found.",
      404,
    );
  const employees = await client.$queryRawUnsafe<Row[]>(
    `SELECT employee.id, employee.hire_date, employee.end_date, employee.bank_information,
            profile.payment_currency, profile.payment_method, profile.bank_account_reference,
            package.id compensation_id, package.base_salary, package.currency, package.pay_frequency compensation_pay_frequency
     FROM hr_employees employee
     LEFT JOIN hr_employee_payroll_profiles profile ON profile.employee_id = employee.id AND profile.status = 'active'
     LEFT JOIN LATERAL (
       SELECT package.* FROM hr_compensation_packages package
       WHERE package.employee_id = employee.id AND package.status = 'approved'
         AND package.effective_from <= $2::date
         AND (package.effective_to IS NULL OR package.effective_to >= $1::date)
       ORDER BY package.effective_from DESC LIMIT 1
     ) package ON TRUE
     WHERE employee.status IN ('active','probation','onboarding','notice')
       AND ($3::uuid IS NULL OR employee.company_id = $3::uuid)
       AND ($4::uuid IS NULL OR profile.payroll_group_id = $4::uuid)
       AND (employee.hire_date IS NULL OR employee.hire_date::date <= $2::date)
       AND (employee.end_date IS NULL OR employee.end_date::date >= $1::date)
     ORDER BY employee.employee_number`,
    toSqlDate(period.start_date),
    toSqlDate(period.end_date),
    companyId,
    run.payroll_group_id || null,
  );
  await client.$executeRawUnsafe(
    `DELETE FROM hr_payroll_exceptions WHERE payroll_run_id = $1::uuid AND status = 'open'`,
    runId,
  );
  await client.$executeRawUnsafe(
    `DELETE FROM hr_payroll_variances WHERE payroll_run_id = $1::uuid AND status = 'open'`,
    runId,
  );

  let grossTotal = 0;
  let deductionTotal = 0;
  let netTotal = 0;
  let employerCostTotal = 0;
  let included = 0;

  for (const employee of employees) {
    if (!employee.compensation_id) {
      await client.$executeRawUnsafe(
        `INSERT INTO hr_payroll_exceptions(id, payroll_run_id, employee_id, code, severity, message, details)
         VALUES ($1::uuid, $2::uuid, $3::uuid, 'MISSING_COMPENSATION', 'blocking', 'No effective approved compensation package.', $4::jsonb)`,
        randomUUID(),
        runId,
        employee.id,
        JSON.stringify({
          requiredAction: "Approve compensation before calculation",
        }),
      );
      continue;
    }
    const inputs = await client.$queryRawUnsafe<Row[]>(
      `SELECT id, input_type, component_code, amount, source_module, source_record_id, metadata
       FROM hr_payroll_inputs WHERE payroll_run_id = $1::uuid AND employee_id = $2::uuid
         AND approval_status = 'approved' AND status = 'ready'`,
      runId,
      employee.id,
    );
    const benefitRows = await client.$queryRawUnsafe<Row[]>(
      `SELECT enrollment.id, plan.name, enrollment.employee_contribution, enrollment.employer_contribution
       FROM hr_employee_benefit_enrollments enrollment JOIN hr_benefit_plans plan ON plan.id = enrollment.benefit_plan_id
       WHERE enrollment.employee_id = $1::uuid AND enrollment.status = 'active'
         AND (enrollment.effective_from IS NULL OR enrollment.effective_from <= $3::date)
         AND (enrollment.effective_to IS NULL OR enrollment.effective_to >= $2::date)`,
      employee.id,
      toSqlDate(period.start_date),
      toSqlDate(period.end_date),
    );
    const previous = await client.$queryRawUnsafe<Row[]>(
      `SELECT item.net_pay FROM hr_payroll_run_items item JOIN hr_payroll_runs previous_run ON previous_run.id = item.payroll_run_id
       JOIN hr_payroll_periods previous_period ON previous_period.id = previous_run.period_id
       WHERE item.employee_id = $1::uuid AND previous_run.id <> $2::uuid
         AND previous_run.status IN ('finalized','payment_processing','paid','reconciled','closed','locked')
       ORDER BY previous_period.pay_date DESC LIMIT 1`,
      employee.id,
      runId,
    );
    const periodStart = new Date(`${toSqlDate(period.start_date)}T00:00:00.000Z`);
    const periodEnd = new Date(`${toSqlDate(period.end_date)}T00:00:00.000Z`);
    const effectiveStart =
      employee.hire_date && new Date(String(employee.hire_date)) > periodStart
        ? new Date(String(employee.hire_date))
        : periodStart;
    const effectiveEnd =
      employee.end_date && new Date(String(employee.end_date)) < periodEnd
        ? new Date(String(employee.end_date))
        : periodEnd;
    const periodDays =
      Math.floor((periodEnd.getTime() - periodStart.getTime()) / 86400000) + 1;
    const payableDays = Math.max(
      0,
      Math.floor(
        (effectiveEnd.getTime() - effectiveStart.getTime()) / 86400000,
      ) + 1,
    );
    const recurringBaseSalary = amountPerPayrollPeriod(
      number(employee.base_salary),
      employee.compensation_pay_frequency,
      period.pay_frequency,
    );
    const periodicBaseSalary = runIncludesBaseSalary(run.run_type)
      ? recurringBaseSalary
      : 0;
    const asLine = (row: Row) => ({
      code: String(row.component_code),
      label: String(row.component_code).replaceAll("_", " ").toLowerCase(),
      amount: number(row.amount),
      taxable: Boolean(
        (row.metadata as Row | null)?.taxable ?? row.input_type === "earning",
      ),
      employerCost: false,
      sourceModule: String(row.source_module),
      sourceRecordId: row.source_record_id
        ? String(row.source_record_id)
        : null,
      statutoryCategory: (row.metadata as Row | null)?.statutoryCategory,
    });
    const statutoryConfigured =
      statutoryRules.enabled &&
      statutoryRules.legalVersion !== "CONFIGURE_ME" &&
      Boolean(statutoryRules.reviewerName && statutoryRules.reviewedAt) &&
      statutoryRules.effectiveFrom <= toSqlDate(period.pay_date);
    const approvedEarnings = inputs
      .filter((row) => row.input_type === "earning")
      .map(asLine);
    const preTaxDeductions = inputs
      .filter((row) => row.input_type === "pre_tax_deduction")
      .map(asLine);
    const postTaxDeductions = [
      ...inputs
        .filter(
          (row) =>
            row.input_type === "deduction" ||
            row.input_type === "post_tax_deduction",
        )
        .map(asLine),
      ...benefitRows
        .filter((row) => number(row.employee_contribution) > 0)
        .map((row) => ({
          code: "BENEFIT",
          label: String(row.name),
          amount: number(row.employee_contribution),
          taxable: false,
          employerCost: false,
          sourceModule: "benefits",
          sourceRecordId: String(row.id),
        })),
    ];
    const employerContributions = benefitRows
      .filter((row) => number(row.employer_contribution) > 0)
      .map((row) => ({
        code: "BENEFIT_EMPLOYER",
        label: String(row.name),
        amount: number(row.employer_contribution),
        taxable: false,
        employerCost: true,
        sourceModule: "benefits",
        sourceRecordId: String(row.id),
      }));
    const statutoryTaxes: ReturnType<typeof asLine>[] = [];
    if (statutoryConfigured) {
      const ytd = await client.$queryRawUnsafe<Row[]>(
        `SELECT COALESCE(SUM(item.taxable_income),0) taxable_income,
                (COUNT(DISTINCT prior_period.id) FILTER (WHERE prior_run.run_type = 'regular'))::int completed_periods,
                COALESCE((SELECT SUM(sso_line.amount) / NULLIF($4, 0)
                  FROM hr_payroll_calculation_lines sso_line
                  JOIN hr_payroll_run_items sso_item ON sso_item.id = sso_line.payroll_run_item_id
                  JOIN hr_payroll_runs sso_run ON sso_run.id = sso_item.payroll_run_id
                  JOIN hr_payroll_periods sso_period ON sso_period.id = sso_run.period_id
                 WHERE sso_item.employee_id = $1::uuid AND sso_run.id <> $2::uuid
                   AND sso_line.component_code = 'TH_SSO_EMPLOYEE'
                   AND sso_run.status IN ('finalized','payment_processing','paid','reconciled','closed')
                   AND date_trunc('month', sso_period.pay_date) = date_trunc('month', $3::date)), 0) month_sso_base,
                COALESCE((SELECT SUM(line.amount) FROM hr_payroll_calculation_lines line
                  JOIN hr_payroll_run_items tax_item ON tax_item.id = line.payroll_run_item_id
                  JOIN hr_payroll_runs tax_run ON tax_run.id = tax_item.payroll_run_id
                  JOIN hr_payroll_periods tax_period ON tax_period.id = tax_run.period_id
                  WHERE tax_item.employee_id = $1::uuid AND tax_run.id <> $2::uuid AND line.component_code = 'TH_PIT'
                    AND tax_run.status IN ('finalized','payment_processing','paid','reconciled','closed')
                    AND EXTRACT(YEAR FROM tax_period.pay_date) = EXTRACT(YEAR FROM $3::date)),0) pit_withheld
           FROM hr_payroll_run_items item JOIN hr_payroll_runs prior_run ON prior_run.id = item.payroll_run_id
           JOIN hr_payroll_periods prior_period ON prior_period.id = prior_run.period_id
          WHERE item.employee_id = $1::uuid AND prior_run.id <> $2::uuid AND prior_run.status IN ('finalized','payment_processing','paid','reconciled','closed')
            AND EXTRACT(YEAR FROM prior_period.pay_date) = EXTRACT(YEAR FROM $3::date)`,
        employee.id,
        runId,
        toSqlDate(period.pay_date),
        statutoryRules.employeeSocialSecurityRate,
      );
      const statutoryEarnings = {
        overtime: 0,
        bonus: 0,
        allowances: 0,
        retroactive: 0,
        terminationPay: 0,
      };
      approvedEarnings.forEach((line) => {
        const bucket = statutoryEarningBucket(
          line.code,
          line.statutoryCategory,
        ) as keyof typeof statutoryEarnings;
        statutoryEarnings[bucket] += line.amount;
      });
      const statutory = calculateThaiPayroll(
        {
          employeeId: String(employee.id),
          period: {
            startDate: toSqlDate(period.start_date),
            endDate: toSqlDate(period.end_date),
            payDate: toSqlDate(period.pay_date),
            periodsPerYear: periodsPerYearForFrequency(period.pay_frequency),
            completedPeriods: Math.min(
              periodsPerYearForFrequency(period.pay_frequency) - 1,
              number(ytd[0]?.completed_periods),
            ),
          },
          earnings: {
            baseSalary:
              periodicBaseSalary * Math.min(1, payableDays / periodDays),
            recurringBaseSalary:
              recurringBaseSalary * Math.min(1, payableDays / periodDays),
            ...statutoryEarnings,
          },
          deductions: {
            unpaidLeave: 0,
            otherPreTax: preTaxDeductions.reduce(
              (sum, line) => sum + line.amount,
              0,
            ),
            otherPostTax: postTaxDeductions.reduce(
              (sum, line) => sum + line.amount,
              0,
            ),
            providentFundEmployeeRate: 0,
            providentFundEmployerRate: 0,
          },
          yearToDate: {
            taxableIncome: number(ytd[0]?.taxable_income),
            pitWithheld: number(ytd[0]?.pit_withheld),
          },
          annualDeductions: statutoryRules.annualDeductions,
          monthToDateSocialSecurityBase: number(ytd[0]?.month_sso_base),
        },
        {
          legalVersion: statutoryRules.legalVersion,
          effectiveFrom: statutoryRules.effectiveFrom,
          employeeSocialSecurityRate: statutoryRules.employeeSocialSecurityRate,
          employerSocialSecurityRate: statutoryRules.employerSocialSecurityRate,
          socialSecurityMonthlyWageCeiling:
            statutoryRules.socialSecurityMonthlyWageCeiling,
          taxBrackets: statutoryRules.taxBrackets,
          roundingDecimals: 2,
          authoritative: true,
        },
      );
      statutoryTaxes.push({
        code: "TH_PIT",
        label: "Personal income tax withholding",
        amount: statutory.pitWithholding,
        taxable: false,
        employerCost: false,
        sourceModule: "statutory",
        sourceRecordId: statutoryRules.legalVersion,
        statutoryCategory: undefined,
      });
      postTaxDeductions.push({
        code: "TH_SSO_EMPLOYEE",
        label: "Employee social security",
        amount: statutory.employeeSocialSecurity,
        taxable: false,
        employerCost: false,
        sourceModule: "statutory",
        sourceRecordId: statutoryRules.legalVersion,
        statutoryCategory: undefined,
      });
      employerContributions.push({
        code: "TH_SSO_EMPLOYER",
        label: "Employer social security",
        amount: statutory.employerSocialSecurity,
        taxable: false,
        employerCost: true,
        sourceModule: "statutory",
        sourceRecordId: statutoryRules.legalVersion,
      });
    }
    const result = calculatePayroll({
      employeeId: String(employee.id),
      currency: String(employee.payment_currency || employee.currency || "THB"),
      periodStart: toSqlDate(period.start_date),
      periodEnd: toSqlDate(period.end_date),
      calculationVersion: nextVersion,
      baseSalary: periodicBaseSalary,
      payableDays,
      periodDays,
      earnings: approvedEarnings,
      preTaxDeductions,
      taxes: [
        ...inputs.filter((row) => row.input_type === "tax").map(asLine),
        ...statutoryTaxes,
      ],
      postTaxDeductions,
      employerContributions,
      previousNetPay: previous[0] ? number(previous[0].net_pay) : null,
      roundingDecimals: 2,
    });
    if (!statutoryConfigured)
      result.exceptions.push({
        code: "STATUTORY_RULES_NOT_APPROVED",
        severity: "blocking",
        message:
          "Enable and approve statutory payroll rules in Admin Center before submission.",
      });
    const itemRows = await client.$queryRawUnsafe<Row[]>(
      `INSERT INTO hr_payroll_run_items
        (id, payroll_run_id, employee_id, base_salary, regular_earnings, variable_earnings, gross_pay,
         taxable_income, total_deductions, net_pay, employer_cost, previous_net_pay, variance_percent,
         payment_destination, components, calculation_trace, input_snapshot, status, version, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
               $14, $15::jsonb, $16::jsonb, $17::jsonb, 'calculated', $18, now(), now())
       ON CONFLICT (payroll_run_id, employee_id) DO UPDATE SET
         base_salary = EXCLUDED.base_salary, regular_earnings = EXCLUDED.regular_earnings,
         variable_earnings = EXCLUDED.variable_earnings, gross_pay = EXCLUDED.gross_pay,
         taxable_income = EXCLUDED.taxable_income, total_deductions = EXCLUDED.total_deductions,
         net_pay = EXCLUDED.net_pay, employer_cost = EXCLUDED.employer_cost,
         previous_net_pay = EXCLUDED.previous_net_pay, variance_percent = EXCLUDED.variance_percent,
         payment_destination = EXCLUDED.payment_destination, components = EXCLUDED.components,
         calculation_trace = EXCLUDED.calculation_trace, input_snapshot = EXCLUDED.input_snapshot,
         status = 'calculated', version = EXCLUDED.version, updated_at = now()
       RETURNING id`,
      randomUUID(),
      runId,
      employee.id,
      result.baseSalary,
      result.proratedBase,
      result.grossPay - result.proratedBase,
      result.grossPay,
      result.taxableIncome,
      result.totalDeductions,
      result.netPay,
      result.employerCost,
      previous[0]?.net_pay || null,
      result.variancePercent,
      employee.bank_account_reference ||
        maskPayrollReference(JSON.stringify(employee.bank_information || {})),
      JSON.stringify(result.lines),
      JSON.stringify(result.trace),
      JSON.stringify({ inputs, benefits: benefitRows }),
      nextVersion,
    );
    const itemId = String(itemRows[0].id);
    for (const line of result.lines) {
      await client.$executeRawUnsafe(
        `INSERT INTO hr_payroll_calculation_lines
          (id, payroll_run_item_id, calculation_version, line_type, component_code, label, amount,
           currency, taxable, employer_cost, source_module, source_record_id, explanation)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)`,
        randomUUID(),
        itemId,
        nextVersion,
        line.lineType,
        line.code,
        line.label,
        line.amount,
        result.currency,
        line.taxable,
        line.employerCost,
        line.sourceModule,
        line.sourceRecordId,
        JSON.stringify({
          calculationVersion: nextVersion,
          formula: result.trace.formula,
        }),
      );
    }
    for (const exception of result.exceptions) {
      await client.$executeRawUnsafe(
        `INSERT INTO hr_payroll_exceptions(id, payroll_run_id, employee_id, code, severity, message, details)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::jsonb)`,
        randomUUID(),
        runId,
        employee.id,
        exception.code,
        exception.severity,
        exception.message,
        JSON.stringify({ calculationVersion: nextVersion }),
      );
    }
    if (
      result.variancePercent !== null &&
      Math.abs(result.variancePercent) >= varianceThreshold
    ) {
      await client.$executeRawUnsafe(
        `INSERT INTO hr_payroll_variances
          (id, payroll_run_id, employee_id, metric, previous_amount, current_amount, variance_amount, variance_percent, materiality_threshold)
         VALUES ($1::uuid, $2::uuid, $3::uuid, 'net_pay', $4, $5, $6, $7, $8)`,
        randomUUID(),
        runId,
        employee.id,
        previous[0]?.net_pay || 0,
        result.netPay,
        result.varianceAmount || 0,
        result.variancePercent,
        varianceThreshold,
      );
    }
    included += 1;
    grossTotal += result.grossPay;
    deductionTotal += result.totalDeductions;
    netTotal += result.netPay;
    employerCostTotal += result.employerCost;
  }
  const blocking = await client.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*)::int count FROM hr_payroll_exceptions WHERE payroll_run_id = $1::uuid AND status = 'open' AND severity IN ('error','blocking')`,
    runId,
  );
  return client.$queryRawUnsafe<Row[]>(
    `UPDATE hr_payroll_runs SET status = $2, employee_count = $3, gross_total = $4,
       total_deductions = $5, net_total = $6, employer_cost = $7, calculation_version = $8,
       calculation_trace = $9::jsonb, processed_at = now(), version = version + 1, updated_at = now()
     WHERE id = $1::uuid RETURNING *`,
    runId,
    number(blocking[0]?.count) ? "exceptions_pending" : "calculated",
    included,
    grossTotal,
    deductionTotal,
    netTotal,
    employerCostTotal,
    nextVersion,
    JSON.stringify({
      engineVersion: "payroll-core-1.0.0",
      calculatedAt: new Date().toISOString(),
      employeeCount: included,
    }),
  );
}
