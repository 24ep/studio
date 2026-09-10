import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/auditLog";
import type { PayrollAccess, PayrollActionInput } from "./contracts";
import { toSqlDate } from "./date-only";
import { payrollPeriodDatesAreValid } from "./workflow-rules";
import { PayrollServiceError, scope } from "./service-foundation";

type Row = Record<string, unknown>;

export async function createRun(
  input: Extract<PayrollActionInput, { action: "create_run" }>,
  access: PayrollAccess,
  actorId: string,
) {
  const companyId = scope(access, input.companyId);
  if (!companyId)
    throw new PayrollServiceError(
      "COMPANY_REQUIRED",
      "Select a company before creating a payroll run.",
      422,
    );
  const context = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT period.id, period.start_date, period.end_date, period.pay_date
       FROM hr_payroll_periods period
      WHERE period.id = $1::uuid
        AND period.status = 'open'
        AND (period.company_id IS NULL OR period.company_id = $2::uuid)
        AND (period.payroll_group_id IS NULL OR period.payroll_group_id IS NOT DISTINCT FROM $3::uuid)
        AND ($3::uuid IS NULL OR EXISTS (
          SELECT 1 FROM hr_payroll_groups payroll_group
           WHERE payroll_group.id = $3::uuid AND payroll_group.status = 'active'
             AND payroll_group.company_id = $2::uuid
        ))
      LIMIT 1`,
    input.periodId,
    companyId,
    input.payrollGroupId || null,
  );
  if (!context[0])
    throw new PayrollServiceError(
      "INVALID_PAYROLL_CONTEXT",
      "The payroll period or group is unavailable for the selected company.",
      422,
    );
  if (
    !payrollPeriodDatesAreValid(
      toSqlDate(context[0].start_date),
      toSqlDate(context[0].end_date),
      toSqlDate(context[0].pay_date),
    )
  )
    throw new PayrollServiceError(
      "INVALID_PAYROLL_PERIOD_DATES",
      "This payroll period has an invalid date sequence. Create a valid period or correct this period before creating a run.",
      422,
    );
  const existing = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT * FROM hr_payroll_runs
     WHERE idempotency_key = $1::text
       AND ($2::uuid IS NULL OR company_id = $2::uuid)
     LIMIT 1`,
    input.idempotencyKey,
    companyId,
  );
  if (existing[0]) {
    await logAudit(
      "AUDIT",
      "Payroll run idempotent retry.",
      "Payroll:Run:Create",
      actorId,
      {
        runId: existing[0]?.id,
        companyId,
        runType: input.runType,
        idempotencyKey: input.idempotencyKey,
      },
    );
    return existing[0];
  }

  let rows: Row[] = [];
  rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO hr_payroll_runs
      (id, period_id, company_id, payroll_group_id, run_type, status, created_by_id, idempotency_key, version, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, 'draft', $6::uuid, $7, 1, now(), now())
     RETURNING *`,
    randomUUID(),
    input.periodId,
    companyId,
    input.payrollGroupId || null,
    input.runType,
    actorId,
    input.idempotencyKey,
  );
  if (!rows[0]) {
    const fallback = await prisma.$queryRawUnsafe<Row[]>(
      `SELECT * FROM hr_payroll_runs
       WHERE idempotency_key = $1::text
         AND ($2::uuid IS NULL OR company_id = $2::uuid)
       LIMIT 1`,
      input.idempotencyKey,
      companyId,
    );
    if (fallback[0]) return fallback[0];
    throw new PayrollServiceError(
      "CREATION_FAILED",
      "Payroll run could not be created.",
      500,
    );
  }
  await logAudit(
    "AUDIT",
    "Payroll run created.",
    "Payroll:Run:Create",
    actorId,
    { runId: rows[0]?.id, companyId, runType: input.runType },
  );
  return rows[0];
}

export async function createPeriod(
  input: Extract<PayrollActionInput, { action: "create_period" }>,
  access: PayrollAccess,
  actorId: string,
) {
  const companyId = scope(access, input.companyId);
  if (input.payrollGroupId) {
    if (!companyId)
      throw new PayrollServiceError(
        "COMPANY_REQUIRED",
        "A company is required when assigning a payroll group to a period.",
        422,
      );
    const group = await prisma.$queryRawUnsafe<Row[]>(
      `SELECT id FROM hr_payroll_groups
        WHERE id = $1::uuid AND company_id = $2::uuid AND status = 'active' LIMIT 1`,
      input.payrollGroupId,
      companyId,
    );
    if (!group[0])
      throw new PayrollServiceError(
        "INVALID_PAYROLL_GROUP",
        "The payroll group is unavailable for the selected company.",
        422,
      );
  }
  if (input.endDate < input.startDate)
    throw new PayrollServiceError(
      "VALIDATION_FAILED",
      "The period end date must be on or after the start date.",
      422,
    );
  if (
    !payrollPeriodDatesAreValid(input.startDate, input.endDate, input.payDate)
  )
    throw new PayrollServiceError(
      "VALIDATION_FAILED",
      "The pay date must be on or after the period end date.",
      422,
    );

  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO hr_payroll_periods
      (id, name, start_date, end_date, pay_date, status, company_id, payroll_group_id, version, created_at, updated_at)
     VALUES ($1::uuid, $2, $3::date, $4::date, $5::date, 'open', $6::uuid, $7::uuid, 1, now(), now())
     RETURNING *`,
    randomUUID(),
    input.name,
    input.startDate,
    input.endDate,
    input.payDate,
    companyId,
    input.payrollGroupId || null,
  );
  await logAudit(
    "AUDIT",
    "Payroll period created.",
    "Payroll:Period:Create",
    actorId,
    { periodId: rows[0]?.id, companyId },
  );
  return rows[0];
}

export async function createGroup(
  input: Extract<PayrollActionInput, { action: "create_group" }>,
  access: PayrollAccess,
  actorId: string,
) {
  const companyId = scope(access, input.companyId);
  if (!companyId)
    throw new PayrollServiceError(
      "COMPANY_REQUIRED",
      "Select a company before creating a payroll group.",
      422,
    );
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO hr_payroll_groups
      (id, company_id, code, name, pay_frequency, currency, timezone, payment_method, status, version, created_by_id, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, 'active', 1, $9::uuid, now(), now())
     RETURNING *`,
    randomUUID(),
    companyId,
    input.code,
    input.name,
    input.payFrequency,
    input.currency,
    input.timezone,
    input.paymentMethod,
    actorId,
  );
  await logAudit(
    "AUDIT",
    "Payroll group created.",
    "Payroll:Group:Create",
    actorId,
    { groupId: rows[0]?.id, companyId },
  );
  return rows[0];
}

export async function assignPayrollProfile(
  input: Extract<PayrollActionInput, { action: "assign_payroll_profile" }>,
  access: PayrollAccess,
  actorId: string,
) {
  const employees = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT employee.id, employee.company_id
     FROM hr_employees employee
     JOIN hr_payroll_groups payroll_group ON payroll_group.id = $2::uuid
       AND (payroll_group.company_id IS NULL OR payroll_group.company_id IS NOT DISTINCT FROM employee.company_id)
     WHERE employee.id = $1::uuid
       AND ($3::uuid IS NULL OR employee.company_id = $3::uuid)
     LIMIT 1`,
    input.employeeId,
    input.payrollGroupId,
    access.actorCompanyId,
  );
  const employee = employees[0];
  if (!employee) {
    throw new PayrollServiceError(
      "SCOPE_VIOLATION",
      "The employee or payroll group is outside your company scope.",
      403,
    );
  }

  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO hr_employee_payroll_profiles
       (id, employee_id, company_id, payroll_group_id, payment_method, payment_currency,
        bank_account_reference, payroll_start_date, status, version, updated_by_id, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8::date,
             'active', 1, $9::uuid, now(), now())
     ON CONFLICT (employee_id) DO UPDATE SET
       company_id = EXCLUDED.company_id,
       payroll_group_id = EXCLUDED.payroll_group_id,
       payment_method = EXCLUDED.payment_method,
       payment_currency = EXCLUDED.payment_currency,
       bank_account_reference = EXCLUDED.bank_account_reference,
       payroll_start_date = EXCLUDED.payroll_start_date,
       status = 'active',
       version = hr_employee_payroll_profiles.version + 1,
       updated_by_id = EXCLUDED.updated_by_id,
       updated_at = now()
     RETURNING *`,
    randomUUID(),
    input.employeeId,
    employee.company_id || null,
    input.payrollGroupId,
    input.paymentMethod,
    input.paymentCurrency,
    input.bankAccountReference || null,
    input.payrollStartDate,
    actorId,
  );
  return rows[0];
}
