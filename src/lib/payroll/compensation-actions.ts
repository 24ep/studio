import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import type { PayrollAccess, PayrollActionInput } from "./contracts";
import { compensationTransitionAllowed } from "./workflow-rules";
import { PayrollServiceError, number } from "./service-foundation";

type Row = Record<string, unknown>;

export async function compensationAction(
  input: Extract<
    PayrollActionInput,
    {
      action:
        "create_change" | "submit_change" | "approve_change" | "reject_change";
    }
  >,
  access: PayrollAccess,
  actorId: string,
) {
  if (input.action === "create_change") {
    if (
      !input.employeeId ||
      !input.changeType ||
      input.proposedAmount === undefined ||
      !input.effectiveDate
    )
      throw new PayrollServiceError(
        "VALIDATION_FAILED",
        "Employee, change type, amount, and effective date are required.",
        422,
      );
    const employee = await prisma.$queryRawUnsafe<Row[]>(
      `SELECT employee.company_id, COALESCE(package.base_salary, 0) current_amount
       FROM hr_employees employee LEFT JOIN LATERAL (
         SELECT base_salary FROM hr_compensation_packages package WHERE package.employee_id = employee.id
         AND package.status = 'approved' ORDER BY effective_from DESC LIMIT 1
       ) package ON TRUE WHERE employee.id = $1::uuid AND ($2::uuid IS NULL OR employee.company_id = $2::uuid)`,
      input.employeeId,
      access.actorCompanyId,
    );
    if (!employee[0])
      throw new PayrollServiceError(
        "EMPLOYEE_NOT_FOUND",
        "Employee is outside your company scope.",
        404,
      );
    const rows = await prisma.$queryRawUnsafe<Row[]>(
      `INSERT INTO hr_compensation_changes
        (id, company_id, employee_id, change_type, current_amount, proposed_amount, currency,
         effective_date, reason, budget_impact, status, requested_by_id)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::date, $9, $10, 'draft', $11::uuid) RETURNING *`,
      randomUUID(),
      employee[0].company_id || null,
      input.employeeId,
      input.changeType,
      employee[0].current_amount,
      input.proposedAmount,
      input.currency,
      input.effectiveDate,
      input.reason,
      input.proposedAmount - number(employee[0].current_amount),
      actorId,
    );
    return rows[0];
  }
  if (!input.id || !input.expectedVersion)
    throw new PayrollServiceError(
      "VALIDATION_FAILED",
      "Change id and version are required.",
      422,
    );
  return prisma.$transaction(async (client) => {
    const rows = await client.$queryRawUnsafe<Row[]>(
      `SELECT * FROM hr_compensation_changes WHERE id = $1::uuid AND version = $2
       AND ($3::uuid IS NULL OR company_id = $3::uuid) FOR UPDATE`,
      input.id,
      input.expectedVersion,
      access.actorCompanyId,
    );
    const change = rows[0];
    if (!change)
      throw new PayrollServiceError(
        "CONCURRENT_UPDATE",
        "Compensation change has changed or is outside your scope.",
        409,
      );
    const target =
      input.action === "submit_change"
        ? "pending_approval"
        : input.action === "approve_change"
          ? "approved"
          : "rejected";
    const currentStatus = String(change.status);
    const allowed = compensationTransitionAllowed(input.action, currentStatus);
    if (!allowed)
      throw new PayrollServiceError(
        "INVALID_TRANSITION",
        `Cannot ${input.action.replaceAll("_", " ")} a compensation change in ${currentStatus} status.`,
        409,
      );
    if (
      input.action === "approve_change" &&
      String(change.requested_by_id || "") === actorId
    )
      throw new PayrollServiceError(
        "FOUR_EYES_REQUIRED",
        "The requester cannot approve their own compensation change.",
        409,
      );
    if (input.action === "approve_change") {
      await client.$executeRawUnsafe(
        `UPDATE hr_compensation_packages SET effective_to = ($2::date - INTERVAL '1 day')::date, updated_at = now()
         WHERE employee_id = $1::uuid AND status = 'approved' AND effective_to IS NULL AND effective_from < $2::date`,
        change.employee_id,
        change.effective_date,
      );
      const packageId = randomUUID();
      await client.$executeRawUnsafe(
        `INSERT INTO hr_compensation_packages
          (id, employee_id, company_id, base_salary, currency, pay_frequency, effective_from,
           reason, status, approved_by_id, approved_at, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'monthly', $6::date, $7, 'approved', $8::uuid, now(), now(), now())`,
        packageId,
        change.employee_id,
        change.company_id || null,
        change.proposed_amount,
        change.currency,
        change.effective_date,
        input.reason,
        actorId,
      );
      change.applied_package_id = packageId;
    }
    const updated = await client.$queryRawUnsafe<Row[]>(
      `UPDATE hr_compensation_changes SET status = $2, approved_by_id = CASE WHEN $2 = 'approved' THEN $3::uuid ELSE approved_by_id END,
         approved_at = CASE WHEN $2 = 'approved' THEN now() ELSE approved_at END,
         applied_package_id = COALESCE($4::uuid, applied_package_id),
         approval_history = approval_history || $5::jsonb, version = version + 1, updated_at = now()
       WHERE id = $1::uuid RETURNING *`,
      input.id,
      target,
      actorId,
      change.applied_package_id || null,
      JSON.stringify([
        {
          action: input.action,
          actorId,
          reason: input.reason,
          at: new Date().toISOString(),
        },
      ]),
    );
    return updated[0];
  });
}
