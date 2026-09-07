import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/auditLog";
import { NotificationService } from "@/lib/notificationService";
import type { PayrollAccess, PayrollActionInput } from "./contracts";
import { getPayrollApprovalRoute, getPayrollOperationsConfig } from "../payroll-approval-route-config";
import { PayrollServiceError, approvalStepStatusLabel, assertPayrollStepResponsibility, number } from "./service-foundation";
import { collectInputs, calculateRun } from "./run-calculation";
import { generateOutputs, reconcileRun } from "./run-outputs";

type Row = Record<string, unknown>;

export async function runAction(
  input: Extract<PayrollActionInput, { runId: string }>,
  access: PayrollAccess,
  actorId: string,
) {
  return prisma.$transaction(async (client) => {
    const rows = await client.$queryRawUnsafe<Row[]>(
      `SELECT * FROM hr_payroll_runs WHERE id = $1::uuid AND version = $2
       AND ($3::uuid IS NULL OR company_id = $3::uuid) FOR UPDATE`,
      input.runId,
      input.expectedVersion,
      access.actorCompanyId,
    );
    const run = rows[0];
    if (!run)
      throw new PayrollServiceError(
        "CONCURRENT_UPDATE",
        "The payroll run changed or is outside your company scope. Refresh and try again.",
        409,
      );
    let result: Row[];
    const status = String(run.status);
    if (
      [
        "approve",
        "return",
        "resolve_exception",
        "waive_exception",
        "resolve_variance",
        "waive_variance",
        "reassign_approval",
      ].includes(input.action) &&
      !access.canApprove
    ) {
      throw new PayrollServiceError(
        "FORBIDDEN",
        "Payroll approval permission is required for this action.",
        403,
      );
    }
    if (input.action === "generate_outputs" && !access.canExport) {
      throw new PayrollServiceError(
        "FORBIDDEN",
        "Payroll export permission is required to generate outputs.",
        403,
      );
    }
    if (
      input.action === "resolve_exception" ||
      input.action === "waive_exception"
    ) {
      const config = await getPayrollOperationsConfig();
      const issue = await client.$queryRawUnsafe<Row[]>(
        `SELECT * FROM hr_payroll_exceptions WHERE id = $1::uuid AND payroll_run_id = $2::uuid FOR UPDATE`,
        input.itemId,
        input.runId,
      );
      if (!issue[0])
        throw new PayrollServiceError(
          "NOT_FOUND",
          "Payroll exception was not found.",
          404,
        );
      if (
        input.action === "waive_exception" &&
        ((String(issue[0].severity) === "blocking" &&
          !config.allowBlockingWaivers) ||
          (String(issue[0].severity) !== "blocking" &&
            !config.allowWarningWaivers))
      ) {
        throw new PayrollServiceError(
          "WAIVER_NOT_ALLOWED",
          "Admin Center policy does not allow this exception to be waived.",
          409,
        );
      }
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_exceptions SET status = $3, resolution = $4, resolved_by_id = $5::uuid, resolved_at = now()
          WHERE id = $1::uuid AND payroll_run_id = $2::uuid RETURNING *`,
        input.itemId,
        input.runId,
        input.action === "waive_exception" ? "waived" : "resolved",
        input.reason,
        actorId,
      );
    } else if (
      input.action === "resolve_variance" ||
      input.action === "waive_variance"
    ) {
      const config = await getPayrollOperationsConfig();
      if (input.action === "waive_variance" && !config.allowWarningWaivers)
        throw new PayrollServiceError(
          "WAIVER_NOT_ALLOWED",
          "Admin Center policy does not allow variance waivers.",
          409,
        );
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_variances SET status = $3, explanation = $4, resolved_by_id = $5::uuid, resolved_at = now()
          WHERE id = $1::uuid AND payroll_run_id = $2::uuid RETURNING *`,
        input.itemId,
        input.runId,
        input.action === "waive_variance" ? "waived" : "resolved",
        input.reason,
        actorId,
      );
      if (!result[0])
        throw new PayrollServiceError(
          "NOT_FOUND",
          "Payroll variance was not found.",
          404,
        );
    } else if (input.action === "reassign_approval") {
      if (status !== "pending_approval" || !input.approverUserId)
        throw new PayrollServiceError(
          "VALIDATION_FAILED",
          "A pending approval and replacement approver are required.",
          422,
        );
      const replacement = await client.$queryRawUnsafe<Row[]>(
        `SELECT user_account.id
           FROM "User" user_account
           LEFT JOIN hr_employees employee ON employee.user_id = user_account.id
          WHERE user_account.id = $1::uuid AND user_account.is_active = true
            AND ($2::uuid IS NULL OR employee.company_id = $2::uuid)
          LIMIT 1`,
        input.approverUserId,
        access.isAdmin ? null : run.company_id || null,
      );
      if (!replacement[0])
        throw new PayrollServiceError(
          "INVALID_APPROVER",
          "The replacement approver must be active and belong to the payroll company.",
          422,
        );
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_approvals SET approver_user_id = $3::uuid, decision_reason = $4, version = version + 1, updated_at = now()
          WHERE id = $1::uuid AND payroll_run_id = $2::uuid AND status = 'pending' RETURNING *`,
        input.itemId,
        input.runId,
        input.approverUserId,
        input.reason,
      );
      if (!result[0])
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Only the current pending approval can be reassigned.",
          409,
        );
    } else if (input.action === "collect_inputs") {
      if (
        !["draft", "collecting_inputs", "returned_for_correction"].includes(
          status,
        )
      )
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Inputs can only be collected before review.",
          409,
        );
      result = await collectInputs(client, run, actorId);
    } else if (input.action === "calculate") {
      if (
        ![
          "draft",
          "collecting_inputs",
          "calculated",
          "exceptions_pending",
          "returned_for_correction",
        ].includes(status)
      )
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "This run cannot be calculated in its current state.",
          409,
        );
      result = await calculateRun(client, run);
    } else if (input.action === "submit") {
      if (!["calculated", "exceptions_pending"].includes(status))
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Calculate the payroll before submitting it.",
          409,
        );
      const blocking = await client.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT COUNT(*)::int count FROM hr_payroll_exceptions WHERE payroll_run_id = $1::uuid AND status = 'open' AND severity IN ('error','blocking')`,
        input.runId,
      );
      if (number(blocking[0]?.count))
        throw new PayrollServiceError(
          "BLOCKING_EXCEPTIONS",
          "Resolve blocking exceptions before submission.",
          409,
        );
      const route = await getPayrollApprovalRoute({
        runType: String(run.run_type),
        payrollGroupId: run.payroll_group_id
          ? String(run.payroll_group_id)
          : null,
        netTotal: number(run.net_total),
      });
      if (!route || !route.steps.length)
        throw new PayrollServiceError(
          "INVALID_APPROVAL_ROUTE",
          "No active payroll approval route is configured.",
          409,
        );
      await client.$executeRawUnsafe(
        `DELETE FROM hr_payroll_approvals WHERE payroll_run_id = $1::uuid`,
        input.runId,
      );
      await client.$executeRawUnsafe(
        `INSERT INTO hr_payroll_approvals(id, payroll_run_id, sequence, approval_role, approver_user_id, status)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid, 'pending')`,
        randomUUID(),
        input.runId,
        1,
        route.steps[0].role,
        route.steps[0].approverUserId || null,
      );
      for (let index = 1; index < route.steps.length; index += 1) {
        await client.$executeRawUnsafe(
          `INSERT INTO hr_payroll_approvals(id, payroll_run_id, sequence, approval_role, approver_user_id, status)
           VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid, 'queued')`,
          randomUUID(),
          input.runId,
          index + 1,
          route.steps[index].role,
          route.steps[index].approverUserId || null,
        );
      }
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_runs SET status = 'pending_approval', approval_status = 'pending', version = version + 1, updated_at = now()
         WHERE id = $1::uuid RETURNING *`,
        input.runId,
      );
    } else if (input.action === "approve") {
      if (status !== "pending_approval")
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Only submitted payroll can be approved.",
          409,
        );
      if (String(run.created_by_id || "") === actorId)
        throw new PayrollServiceError(
          "FOUR_EYES_REQUIRED",
          "The payroll creator cannot approve the same run.",
          409,
        );
      const approvals = await client.$queryRawUnsafe<Row[]>(
        `SELECT id, sequence, approval_role, approver_user_id, status
         FROM hr_payroll_approvals WHERE payroll_run_id = $1::uuid
         ORDER BY sequence FOR UPDATE`,
        input.runId,
      );
      if (!approvals.length)
        throw new PayrollServiceError(
          "INVALID_APPROVAL_ROUTE",
          "This payroll has no configured approval steps and cannot be approved.",
          409,
        );
      else {
        const pending = approvals.find(
          (approval) =>
            approvalStepStatusLabel(String(approval.status)) === "pending",
        );
        if (!pending)
          throw new PayrollServiceError(
            "INVALID_TRANSITION",
            "No approval step is currently waiting for action.",
            409,
          );
        assertPayrollStepResponsibility(access, actorId, pending);
        const currentSequence = Number(pending.sequence);
        await client.$executeRawUnsafe(
          `UPDATE hr_payroll_approvals SET status = 'approved', approver_user_id = $2::uuid,
           decision_reason = $3, decided_at = now(), updated_at = now()
           WHERE payroll_run_id = $1::uuid AND sequence = $4`,
          input.runId,
          actorId,
          input.reason,
          currentSequence,
        );
        const next = approvals.find(
          (approval) => Number(approval.sequence) === currentSequence + 1,
        );
        if (next) {
          await client.$executeRawUnsafe(
            `UPDATE hr_payroll_approvals SET status = 'pending', updated_at = now()
             WHERE payroll_run_id = $1::uuid AND sequence = $2`,
            input.runId,
            currentSequence + 1,
          );
          result = await client.$queryRawUnsafe<Row[]>(
            `SELECT * FROM hr_payroll_runs WHERE id = $1::uuid`,
            input.runId,
          );
        } else {
          result = await client.$queryRawUnsafe<Row[]>(
            `UPDATE hr_payroll_runs SET status = 'approved', approval_status = 'approved', approved_by_id = $2::uuid,
             approved_at = now(), version = version + 1, updated_at = now() WHERE id = $1::uuid RETURNING *`,
            input.runId,
            actorId,
          );
        }
      }
    } else if (input.action === "return") {
      if (status !== "pending_approval")
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Only submitted payroll can be returned.",
          409,
        );
      const approvals = await client.$queryRawUnsafe<Row[]>(
        `SELECT id, sequence, approval_role, approver_user_id, status FROM hr_payroll_approvals WHERE payroll_run_id = $1::uuid ORDER BY sequence FOR UPDATE`,
        input.runId,
      );
      const pending = approvals.find(
        (approval) =>
          approvalStepStatusLabel(String(approval.status)) === "pending",
      );
      if (!pending)
        throw new PayrollServiceError(
          "INVALID_APPROVAL_ROUTE",
          "No configured approval step is waiting for a decision.",
          409,
        );
      assertPayrollStepResponsibility(access, actorId, pending);
      const currentSequence = Number(pending.sequence);
      await client.$executeRawUnsafe(
        `UPDATE hr_payroll_approvals SET status = 'returned', approver_user_id = $2::uuid,
           decision_reason = $3, decided_at = now(), updated_at = now()
         WHERE payroll_run_id = $1::uuid AND sequence = $4`,
        input.runId,
        actorId,
        input.reason,
        currentSequence,
      );
      await client.$executeRawUnsafe(
        `UPDATE hr_payroll_approvals SET status = 'queued', updated_at = now()
         WHERE payroll_run_id = $1::uuid AND status IN ('pending','queued') AND sequence > $2`,
        input.runId,
        currentSequence,
      );
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_runs SET status = 'returned_for_correction', approval_status = 'returned',
           version = version + 1, updated_at = now() WHERE id = $1::uuid RETURNING *`,
        input.runId,
      );
    } else if (input.action === "finalize") {
      if (status !== "approved")
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Approval is required before finalization.",
          409,
        );
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_runs SET status = 'finalized', finalized_at = now(), locked_at = now(),
           version = version + 1, updated_at = now() WHERE id = $1::uuid RETURNING *`,
        input.runId,
      );
    } else if (input.action === "generate_outputs") {
      if (status !== "finalized")
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Finalize payroll before generating outputs.",
          409,
        );
      result = await generateOutputs(client, run, actorId);
    } else if (input.action === "release_payslips") {
      if (
        !["payment_processing", "paid", "reconciled", "closed"].includes(status)
      )
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Generate payroll outputs before releasing payslips.",
          409,
        );
      const released = await client.$queryRawUnsafe<Array<{ count: number }>>(
        `WITH released AS (
           UPDATE hr_payslips payslip
              SET status = 'released', released_by_id = $2::uuid,
                  published_at = COALESCE(published_at, now()),
                  version = version + 1, updated_at = now()
            WHERE payslip.payroll_run_item_id IN (
              SELECT item.id FROM hr_payroll_run_items item
               WHERE item.payroll_run_id = $1::uuid
            )
              AND payslip.status <> 'released'
          RETURNING payslip.id
         ) SELECT COUNT(*)::int count FROM released`,
        input.runId,
        actorId,
      );
      if (!number(released[0]?.count)) {
        const existing = await client.$queryRawUnsafe<Array<{ count: number }>>(
          `SELECT COUNT(*)::int count
             FROM hr_payslips payslip
             JOIN hr_payroll_run_items item ON item.id = payslip.payroll_run_item_id
            WHERE item.payroll_run_id = $1::uuid AND payslip.status = 'released'`,
          input.runId,
        );
        if (!number(existing[0]?.count))
          throw new PayrollServiceError(
            "NO_PAYSLIPS",
            "No generated payslips are available to release.",
            409,
          );
      }
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_runs SET published_at = COALESCE(published_at, now()),
           version = version + 1, updated_at = now()
         WHERE id = $1::uuid RETURNING *`,
        input.runId,
      );
    } else if (input.action === "mark_paid") {
      if (status !== "payment_processing")
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          String(run.run_type) === "reversal"
            ? "Generate the accounting correction before recording recovery."
            : "Generate payment outputs before marking payroll paid.",
          409,
        );
      const config = await getPayrollOperationsConfig();
      const paymentBatch = await client.$queryRawUnsafe<Row[]>(
        `SELECT file_path FROM hr_payroll_payment_batches WHERE payroll_run_id = $1::uuid FOR UPDATE`,
        input.runId,
      );
      const storedEvidenceReference =
        input.evidenceReference ||
        (paymentBatch[0]?.file_path
          ? String(paymentBatch[0].file_path)
          : undefined);
      if (config.requirePaymentReference && !input.paymentReference)
        throw new PayrollServiceError(
          "PAYMENT_REFERENCE_REQUIRED",
          "A bank or payment confirmation reference is required.",
          422,
        );
      if (config.requirePaymentEvidence && !storedEvidenceReference)
        throw new PayrollServiceError(
          "PAYMENT_EVIDENCE_REQUIRED",
          "Payment evidence is required by Admin Center policy.",
          422,
        );
      await client.$executeRawUnsafe(
        `UPDATE hr_payroll_payment_batches SET status = 'paid', reference = $2, file_path = COALESCE($3, file_path), approved_by_id = $4::uuid,
           approved_at = now(), updated_at = now() WHERE payroll_run_id = $1::uuid`,
        input.runId,
        input.paymentReference || "",
        storedEvidenceReference || null,
        actorId,
      );
      await client.$executeRawUnsafe(
        `UPDATE hr_payroll_payments SET status = 'paid', paid_at = now(), updated_at = now()
         WHERE payment_batch_id IN (SELECT id FROM hr_payroll_payment_batches WHERE payroll_run_id = $1::uuid)`,
        input.runId,
      );
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_runs SET status = 'paid', payment_status = $2, paid_at = now(),
           reconciliation_status = 'pending', version = version + 1, updated_at = now()
         WHERE id = $1::uuid RETURNING *`,
        input.runId,
        String(run.run_type) === "reversal" ? "recovered" : "paid",
      );
    } else if (input.action === "reconcile") {
      if (!["paid", "reconciliation_pending", "reconciled"].includes(status))
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Only paid payroll can be reconciled.",
          409,
        );
      result = await reconcileRun(client, run, actorId);
    } else if (input.action === "close") {
      if (status !== "reconciled")
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Reconcile payroll before closing the period.",
          409,
        );
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_runs SET status = 'closed', closed_at = now(), version = version + 1, updated_at = now()
         WHERE id = $1::uuid RETURNING *`,
        input.runId,
      );
      if (run.reversal_of_id) {
        await client.$executeRawUnsafe(
          `UPDATE hr_payroll_runs SET status = 'reversed', version = version + 1, updated_at = now()
            WHERE id = $1::uuid AND status = 'reversal_pending'`,
          run.reversal_of_id,
        );
      }
      const unfinished = await client.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT COUNT(*)::int count FROM hr_payroll_runs
          WHERE period_id = $1::uuid AND id <> $2::uuid
            AND status NOT IN ('closed', 'reversed')`,
        run.period_id,
        input.runId,
      );
      if (!number(unfinished[0]?.count)) {
        await client.$executeRawUnsafe(
          `UPDATE hr_payroll_periods
              SET status = 'closed', locked_at = now(), locked_by_id = $2::uuid,
                  version = version + 1, updated_at = now()
            WHERE id = $1::uuid AND status = 'open'`,
          run.period_id,
          actorId,
        );
      }
    } else if (input.action === "reverse") {
      if (
        ![
          "finalized",
          "payment_processing",
          "paid",
          "reconciled",
          "closed",
        ].includes(status)
      )
        throw new PayrollServiceError(
          "INVALID_TRANSITION",
          "Only finalized payroll can be reversed.",
          409,
        );
      const existingReversal = await client.$queryRawUnsafe<Row[]>(
        `SELECT id, status FROM hr_payroll_runs
          WHERE reversal_of_id = $1::uuid AND status <> 'reversed'
          ORDER BY created_at DESC LIMIT 1`,
        input.runId,
      );
      if (existingReversal[0])
        throw new PayrollServiceError(
          "REVERSAL_ALREADY_EXISTS",
          "A reversal workflow already exists for this payroll run.",
          409,
          { reversalRunId: existingReversal[0].id },
        );
      const reversalId = randomUUID();
      await client.$executeRawUnsafe(
        `INSERT INTO hr_payroll_runs
          (id, period_id, company_id, payroll_group_id, rule_set_id, run_type, status,
           reversal_of_id, created_by_id, idempotency_key, gross_total, net_total,
           total_deductions, employer_cost, employee_count, calculation_version,
           calculation_trace, processed_at, validated_at, version, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'reversal', 'calculated',
                 $6::uuid, $7::uuid, $8, -$9, -$10, -$11, -$12, $13, 1,
                 $14::jsonb, now(), now(), 1, now(), now())`,
        reversalId,
        run.period_id,
        run.company_id || null,
        run.payroll_group_id || null,
        run.rule_set_id || null,
        run.id,
        actorId,
        `reversal:${run.id}:${input.expectedVersion}`,
        number(run.gross_total),
        number(run.net_total),
        number(run.total_deductions),
        number(run.employer_cost),
        number(run.employee_count),
        JSON.stringify({
          engineVersion: "payroll-core-1.0.0",
          reversalOf: run.id,
          generatedAt: new Date().toISOString(),
          reason: input.reason,
        }),
      );
      await client.$executeRawUnsafe(
        `INSERT INTO hr_payroll_run_items
          (id, payroll_run_id, employee_id, gross_pay, net_pay, adjustments, base_salary,
           regular_earnings, variable_earnings, reimbursements, total_deductions,
           employer_cost, taxable_income, pit_withholding, employee_social_security,
           employer_social_security, provident_fund_employee, provident_fund_employer,
           previous_net_pay, variance_percent, payment_destination, components,
           calculation_trace, input_snapshot, version, status, created_at, updated_at)
         SELECT gen_random_uuid(), $2::uuid, employee_id, -gross_pay, -net_pay, -adjustments,
                -base_salary, -regular_earnings, -variable_earnings, -reimbursements,
                -total_deductions, -employer_cost, -taxable_income, -pit_withholding,
                -employee_social_security, -employer_social_security,
                -provident_fund_employee, -provident_fund_employer, previous_net_pay,
                variance_percent, payment_destination,
                CASE WHEN jsonb_typeof(components) = 'array' THEN
                  COALESCE((
                    SELECT jsonb_agg(
                      component || jsonb_build_object(
                        'amount', -COALESCE((component->>'amount')::numeric, 0)
                      )
                    ) FROM jsonb_array_elements(components) component
                  ), '[]'::jsonb)
                ELSE components END,
                calculation_trace || jsonb_build_object('reversalOfItemId', id),
                input_snapshot, 1, 'calculated', now(), now()
           FROM hr_payroll_run_items WHERE payroll_run_id = $1::uuid`,
        input.runId,
        reversalId,
      );
      result = await client.$queryRawUnsafe<Row[]>(
        `UPDATE hr_payroll_runs SET status = 'reversal_pending', version = version + 1, updated_at = now()
         WHERE id = $1::uuid RETURNING *`,
        input.runId,
      );
    } else {
      throw new PayrollServiceError(
        "UNSUPPORTED_ACTION",
        "Unsupported payroll action.",
        400,
      );
    }
    const paymentReference =
      "paymentReference" in input ? input.paymentReference : undefined;
    const auditEvidenceReference =
      "evidenceReference" in input ? input.evidenceReference : undefined;
    await logAudit(
      "AUDIT",
      `Payroll run ${input.action}.`,
      `Payroll:Run:${input.action}`,
      actorId,
      {
        runId: input.runId,
        entity: "payroll-run",
        entityId: input.runId,
        reason: input.reason,
        paymentReference,
        evidenceReference: auditEvidenceReference,
        fromStatus: status,
        toStatus: result[0]?.status,
      },
    );
    const creatorId = String(run.created_by_id || "");
    if (
      creatorId &&
      creatorId !== actorId &&
      ["approve", "return", "finalize"].includes(input.action)
    ) {
      await NotificationService.createNotification(
        creatorId,
        {
          type: "payroll",
          title: `Payroll ${String(result[0]?.status).replaceAll("_", " ")}`,
          message: input.reason,
          data: { href: "/payroll/runs", payrollRunId: input.runId },
        },
        actorId,
      ).catch(() => null);
    }
    return result[0];
  });
}
