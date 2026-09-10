import type { Prisma } from "@prisma/client";

import { logAudit } from "@/lib/auditLog";
import prisma from "@/lib/prisma";
import type { PayrollAccess, PayrollActionInput } from "./contracts";
import { PayrollServiceError } from "./service-foundation";
import { toSqlDate } from "./date-only";
import { collectAttendanceExportInputs } from "./attendance-inputs";
import { collectLeavePayrollInputs } from "./leave-inputs";

type Db = Prisma.TransactionClient | typeof prisma;
type Row = Record<string, unknown>;

function number(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function collectInputs(
  client: Db,
  run: Row,
  actorId: string,
) {
  const runId = String(run.id);
  const companyId = run.company_id ? String(run.company_id) : null;
  const payrollGroupId = run.payroll_group_id ? String(run.payroll_group_id) : null;
  const period = await client.$queryRawUnsafe<Row[]>(
    `SELECT start_date, end_date
       FROM hr_payroll_periods
      WHERE id = $1::uuid
      LIMIT 1`,
    String(run.period_id),
  );

  if (!period[0]) {
    throw new PayrollServiceError(
      "PERIOD_NOT_FOUND",
      "Payroll inputs cannot be collected because this run has no payroll period. Select a valid period and try again.",
      409,
    );
  }

  const start = toSqlDate(period[0].start_date);
  const end = toSqlDate(period[0].end_date);

  await collectAttendanceExportInputs(client as Prisma.TransactionClient, {
    runId,
    companyId,
    payrollGroupId,
    start,
    end,
    actorId,
  });

  await collectLeavePayrollInputs(client as Prisma.TransactionClient, {
    runId,
    companyId,
    payrollGroupId,
    start,
    end,
    actorId,
  });

  // Reimbursements are routed through the post-tax input lane so the statutory
  // earnings pipeline never mistakes them for salary. The calculation engine
  // recognizes the reimbursement metadata and converts them into a net-only
  // payout: take-home increases, while salary gross and taxable income do not.
  // A source claim is attached to only one payroll run even when later runs
  // overlap the same expense period.
  await client.$executeRawUnsafe(
    `INSERT INTO hr_payroll_inputs
      (id, company_id, payroll_run_id, employee_id, input_type, component_code, amount, currency,
       source_module, source_record_id, effective_date, approval_status, status, idempotency_key,
       created_by_id, metadata)
     SELECT gen_random_uuid(), claim.company_id, $1::uuid, claim.employee_id, 'post_tax_deduction', 'EXPENSE_REIMBURSEMENT',
            claim.employee_reimbursement, claim.reimbursement_currency, 'expenses', claim.id::text,
            claim.period_end, 'approved', 'ready', concat('expense-claim:', claim.id::text), $2::uuid,
            jsonb_build_object('taxable', false, 'reimbursement', true, 'netOnly', true, 'source', 'expenses')
       FROM expense_claims claim
       LEFT JOIN hr_employee_payroll_profiles profile
         ON profile.employee_id = claim.employee_id AND profile.status = 'active'
      WHERE claim.status = 'approved'
        AND COALESCE(claim.payment_status, 'not_ready') = 'not_ready'
        AND claim.employee_reimbursement > 0
        AND claim.period_end BETWEEN $3::date AND $4::date
        AND ($5::uuid IS NULL OR claim.company_id = $5::uuid)
        AND ($6::uuid IS NULL OR profile.payroll_group_id = $6::uuid)
        AND NOT EXISTS (
          SELECT 1 FROM hr_payroll_inputs existing
           WHERE existing.source_module = 'expenses'
             AND existing.source_record_id = claim.id::text
        )
     ON CONFLICT (company_id, idempotency_key) DO NOTHING`,
    runId,
    actorId,
    start,
    end,
    companyId,
    payrollGroupId,
  );

  // Attach approved manual adjustments that have not yet been assigned to a run.
  // Group-scoped runs must not claim adjustments belonging to another group.
  await client.$executeRawUnsafe(
    `UPDATE hr_payroll_inputs payroll_input
        SET payroll_run_id = $1::uuid, updated_at = now()
       FROM hr_employee_payroll_profiles profile
      WHERE payroll_input.payroll_run_id IS NULL
        AND payroll_input.employee_id = profile.employee_id
        AND profile.status = 'active'
        AND payroll_input.approval_status = 'approved'
        AND payroll_input.status = 'ready'
        AND payroll_input.effective_date BETWEEN $2::date AND $3::date
        AND ($4::uuid IS NULL OR payroll_input.company_id = $4::uuid)
        AND ($5::uuid IS NULL OR profile.payroll_group_id = $5::uuid)`,
    runId,
    start,
    end,
    companyId,
    payrollGroupId,
  );

  return client.$queryRawUnsafe<Row[]>(
    `UPDATE hr_payroll_runs
        SET status = 'collecting_inputs', version = version + 1, updated_at = now()
      WHERE id = $1::uuid
      RETURNING *`,
    runId,
  );
}

export async function collectPayrollInputs(
  input: PayrollActionInput,
  access: PayrollAccess,
  actorId: string,
) {
  if (!access.canManage) {
    throw new PayrollServiceError(
      "FORBIDDEN",
      "Payroll management permission is required.",
      403,
    );
  }

  if (input.action !== "collect_inputs") {
    throw new PayrollServiceError(
      "INVALID_ACTION",
      "This payroll operation only supports input collection.",
      400,
    );
  }

  try {
    const result = await prisma.$transaction(async (client) => {
      const rows = await client.$queryRawUnsafe<Row[]>(
        `SELECT *
           FROM hr_payroll_runs
          WHERE id = $1::uuid
            AND version = $2
            AND ($3::uuid IS NULL OR company_id = $3::uuid)
          FOR UPDATE`,
        input.runId,
        input.expectedVersion,
        access.actorCompanyId,
      );
      const run = rows[0];
      if (!run) {
        throw new PayrollServiceError(
          "CONCURRENT_UPDATE",
          "The payroll run changed or is outside your company scope. Refresh and try again.",
          409,
        );
      }

      const status = String(run.status);
      if (
        !["draft", "collecting_inputs", "returned_for_correction"].includes(
          status,
        )
      ) {
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Inputs can only be collected before review.",
          409,
        );
      }

      const collected = await collectInputs(client, run, actorId);
      return { run, collected: collected[0] };
    });

    await logAudit(
      "AUDIT",
      "Payroll run collect_inputs.",
      "Payroll:Run:collect_inputs",
      actorId,
      {
        runId: input.runId,
        entity: "payroll-run",
        entityId: input.runId,
        fromStatus: String(result.run.status),
        toStatus: String(result.collected?.status || "collecting_inputs"),
        version: number(result.collected?.version),
      },
    );

    return result.collected;
  } catch (error) {
    if (error instanceof PayrollServiceError) throw error;
    console.error("[Payroll workspace] input collection failed", error);
    throw new PayrollServiceError(
      "INPUT_COLLECTION_FAILED",
      "Payroll could not collect the inputs. Check the payroll period and approved source records, then try again.",
      500,
    );
  }
}
