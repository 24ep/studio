import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getPayrollOperationsConfig } from "../payroll-approval-route-config";
import { maskPayrollReference } from "./permissions";
import { payrollExportAllowedForRun } from "./workflow-rules";
import { PayrollServiceError, number } from "./service-foundation";

type Db = Prisma.TransactionClient | typeof prisma;
type Row = Record<string, unknown>;

export async function generateOutputs(client: Db, run: Row, actorId: string) {
  const runId = String(run.id);
  const periodId = String(run.period_id);
  const companyId = run.company_id ? String(run.company_id) : null;
  const isReversal = String(run.run_type) === "reversal";
  const operations = await getPayrollOperationsConfig();
  const items = await client.$queryRawUnsafe<Row[]>(
    `SELECT item.*, profile.payment_method, profile.bank_account_reference
     FROM hr_payroll_run_items item
     LEFT JOIN hr_employee_payroll_profiles profile ON profile.employee_id = item.employee_id
     WHERE item.payroll_run_id = $1::uuid AND item.status = 'calculated'`,
    runId,
  );
  if (!items.length)
    throw new PayrollServiceError(
      "NO_CALCULATIONS",
      "Calculate this run before generating outputs.",
      409,
    );
  for (const item of items) {
    await client.$executeRawUnsafe(
      `INSERT INTO hr_payslips
        (id, payroll_run_item_id, employee_id, company_id, payroll_period_id, status, currency,
         gross_pay, total_deductions, net_pay, breakdown, released_by_id, published_at, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $12, $6, $7, $8, $9,
               $10::jsonb, $11::uuid, CASE WHEN $12 = 'released' THEN now() ELSE NULL END, now(), now())
       ON CONFLICT (payroll_run_item_id) DO UPDATE SET
         gross_pay = EXCLUDED.gross_pay, total_deductions = EXCLUDED.total_deductions,
         net_pay = EXCLUDED.net_pay, breakdown = EXCLUDED.breakdown,
         status = EXCLUDED.status, released_by_id = EXCLUDED.released_by_id, published_at = CASE WHEN EXCLUDED.status = 'released' THEN now() ELSE published_at END,
         version = hr_payslips.version + 1, updated_at = now()`,
      randomUUID(),
      item.id,
      item.employee_id,
      companyId,
      periodId,
      "THB",
      item.gross_pay,
      item.total_deductions,
      item.net_pay,
      JSON.stringify(item.components || []),
      actorId,
      "draft",
    );
  }
  const batchId = randomUUID();
  const batchPrefix = isReversal ? "RECOVERY" : "PAY";
  const batchRef = `${batchPrefix}-${new Date().getUTCFullYear()}-${runId.slice(0, 8).toUpperCase()}`;
  const batchRows = await client.$queryRawUnsafe<Row[]>(
    `INSERT INTO hr_payroll_payment_batches
      (id, company_id, payroll_run_id, reference, employee_count, total_amount, status, created_by_id)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::uuid)
     ON CONFLICT (payroll_run_id) DO UPDATE SET employee_count = EXCLUDED.employee_count,
       total_amount = EXCLUDED.total_amount, status = EXCLUDED.status,
       version = hr_payroll_payment_batches.version + 1, updated_at = now()
     RETURNING id`,
    batchId,
    companyId,
    runId,
    batchRef,
    isReversal ? 0 : items.length,
    isReversal ? 0 : run.net_total,
    isReversal ? "recovery_required" : "ready",
    actorId,
  );
  const persistedBatchId = String(batchRows[0].id);
  if (!isReversal) {
    for (const item of items) {
      await client.$executeRawUnsafe(
        `INSERT INTO hr_payroll_payments
          (id, payment_batch_id, payroll_run_item_id, employee_id, amount, currency, payment_method, payment_destination, status)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, 'THB', $6, $7, 'ready')
         ON CONFLICT (payment_batch_id, employee_id) DO UPDATE SET amount = EXCLUDED.amount,
           payment_destination = EXCLUDED.payment_destination, status = 'ready', updated_at = now()`,
        randomUUID(),
        persistedBatchId,
        item.id,
        item.employee_id,
        item.net_pay,
        item.payment_method || "bank_transfer",
        maskPayrollReference(
          item.bank_account_reference || item.payment_destination,
        ),
      );
    }
  }
  const entryId = randomUUID();
  const entryRows = await client.$queryRawUnsafe<Row[]>(
    `INSERT INTO hr_payroll_accounting_entries
      (id, company_id, payroll_run_id, reference, accounting_date, currency, total_debit, total_credit, status)
     SELECT $1::uuid, $2::uuid, $3::uuid, $4, period.pay_date, 'THB', $5, $5, 'ready'
     FROM hr_payroll_periods period WHERE period.id = $6::uuid
     ON CONFLICT (payroll_run_id) DO UPDATE SET total_debit = EXCLUDED.total_debit,
       total_credit = EXCLUDED.total_credit, status = 'ready', version = hr_payroll_accounting_entries.version + 1, updated_at = now()
     RETURNING id`,
    entryId,
    companyId,
    runId,
    `PAYROLL-${runId.slice(0, 8).toUpperCase()}`,
    Math.abs(number(run.employer_cost)),
    periodId,
  );
  const persistedEntryId = String(entryRows[0].id);
  await client.$executeRawUnsafe(
    `DELETE FROM hr_payroll_accounting_lines WHERE accounting_entry_id = $1::uuid`,
    persistedEntryId,
  );
  const employerContributions =
    number(run.employer_cost) - number(run.gross_total);
  const debitPosting = (value: number) => ({
    debit: Math.max(0, value),
    credit: Math.max(0, -value),
  });
  const creditPosting = (value: number) => ({
    debit: Math.max(0, -value),
    credit: Math.max(0, value),
  });
  const accountingLines = [
    {
      type: "salary_expense",
      description: "Payroll gross earnings",
      ...debitPosting(number(run.gross_total)),
    },
    {
      type: "employer_contribution_expense",
      description: "Employer contributions",
      ...debitPosting(employerContributions),
    },
    {
      type: "payroll_payable",
      description: "Employee net payroll payable",
      ...creditPosting(number(run.net_total)),
    },
    {
      type: "deduction_liability",
      description: "Employee deductions and tax",
      ...creditPosting(number(run.total_deductions)),
    },
    {
      type: "employer_contribution_liability",
      description: "Employer contribution liabilities",
      ...creditPosting(employerContributions),
    },
  ].filter((line) => line.debit > 0 || line.credit > 0);
  for (const line of accountingLines) {
    await client.$executeRawUnsafe(
      `INSERT INTO hr_payroll_accounting_lines(id, accounting_entry_id, account_type, description, debit, credit)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)`,
      randomUUID(),
      persistedEntryId,
      line.type,
      line.description,
      line.debit,
      line.credit,
    );
  }
  for (const [exportType, format] of [
    ["bank_payment", operations.bankExportFormat],
    ["accounting", operations.accountingExportFormat],
  ] as const) {
    if (
      !payrollExportAllowedForRun(
        run.run_type,
        exportType === "bank_payment" ? "bank" : exportType,
      )
    )
      continue;
    await client.$executeRawUnsafe(
      `INSERT INTO hr_payroll_exports(id, company_id, payroll_run_id, export_type, status, totals, generated_by_id, generated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'generated', $5::jsonb, $6::uuid, now())`,
      randomUUID(),
      companyId,
      runId,
      `${exportType}_${format}`,
      JSON.stringify({
        employeeCount: items.length,
        netTotal: number(run.net_total),
        format,
      }),
      actorId,
    );
  }
  return client.$queryRawUnsafe<Row[]>(
    `UPDATE hr_payroll_runs SET status = 'payment_processing', payment_status = $2,
       accounting_status = 'ready', version = version + 1, updated_at = now()
     WHERE id = $1::uuid RETURNING *`,
    runId,
    isReversal ? "recovery_required" : "ready",
  );
}

export async function reconcileRun(client: Db, run: Row, actorId: string) {
  const runId = String(run.id);
  const companyId = run.company_id ? String(run.company_id) : null;
  const totals = await client.$queryRawUnsafe<Row[]>(
    `SELECT
       COALESCE((SELECT SUM(net_pay) FROM hr_payroll_run_items WHERE payroll_run_id = $1::uuid), 0) calculation_total,
       COALESCE((SELECT SUM(payslip.net_pay) FROM hr_payslips payslip JOIN hr_payroll_run_items item ON item.id = payslip.payroll_run_item_id WHERE item.payroll_run_id = $1::uuid), 0) payslip_total,
       COALESCE((SELECT SUM(payment.amount) FROM hr_payroll_payments payment JOIN hr_payroll_payment_batches batch ON batch.id = payment.payment_batch_id WHERE batch.payroll_run_id = $1::uuid), 0) payment_total,
       COALESCE((SELECT total_debit FROM hr_payroll_accounting_entries WHERE payroll_run_id = $1::uuid), 0) accounting_debit,
       COALESCE((SELECT total_credit FROM hr_payroll_accounting_entries WHERE payroll_run_id = $1::uuid), 0) accounting_credit`,
    runId,
  );
  const total = totals[0];
  const isReversal = String(run.run_type) === "reversal";
  const discrepancies = [
    number(total.calculation_total) - number(total.payslip_total),
    isReversal
      ? 0
      : number(total.calculation_total) - number(total.payment_total),
    number(total.accounting_debit) - number(total.accounting_credit),
  ];
  const discrepancy = Math.max(
    ...discrepancies.map((value) => Math.abs(value)),
  );
  const status = discrepancy <= 0.01 ? "reconciled" : "exception_found";
  const issues = discrepancies
    .map((value, index) => ({
      category: ["payslip", "payment", "accounting"][index],
      amount: value,
    }))
    .filter((issue) => Math.abs(issue.amount) > 0.01);
  await client.$executeRawUnsafe(
    `INSERT INTO hr_payroll_reconciliations
      (id, company_id, payroll_run_id, status, calculation_total, payslip_total, payment_total,
       accounting_debit, accounting_credit, discrepancy_amount, issues, owner_user_id, reconciled_by_id, reconciled_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::uuid,
             CASE WHEN $4 = 'reconciled' THEN $12::uuid ELSE NULL END,
             CASE WHEN $4 = 'reconciled' THEN now() ELSE NULL END)
     ON CONFLICT (payroll_run_id) DO UPDATE SET status = EXCLUDED.status,
       calculation_total = EXCLUDED.calculation_total, payslip_total = EXCLUDED.payslip_total,
       payment_total = EXCLUDED.payment_total, accounting_debit = EXCLUDED.accounting_debit,
       accounting_credit = EXCLUDED.accounting_credit, discrepancy_amount = EXCLUDED.discrepancy_amount,
       issues = EXCLUDED.issues, reconciled_by_id = EXCLUDED.reconciled_by_id,
       reconciled_at = EXCLUDED.reconciled_at, version = hr_payroll_reconciliations.version + 1, updated_at = now()`,
    randomUUID(),
    companyId,
    runId,
    status,
    total.calculation_total,
    total.payslip_total,
    total.payment_total,
    total.accounting_debit,
    total.accounting_credit,
    discrepancy,
    JSON.stringify(issues),
    actorId,
  );
  return client.$queryRawUnsafe<Row[]>(
    `UPDATE hr_payroll_runs SET status = CASE WHEN $2 = 'reconciled' THEN 'reconciled' ELSE status END,
       reconciliation_status = $2, version = version + 1, updated_at = now()
     WHERE id = $1::uuid RETURNING *`,
    runId,
    status,
  );
}
