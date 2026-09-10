import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import type { PayrollAccess, PayrollActionInput } from "./contracts";
import { benefitEnrollmentTransitionAllowed } from "./workflow-rules";
import { PayrollServiceError, matchesBenefitRules } from "./service-foundation";

type Row = Record<string, unknown>;

export async function benefitAction(
  input: Extract<
    PayrollActionInput,
    {
      action:
        | "create_plan"
        | "update_plan"
        | "enroll"
        | "approve_enrollment"
        | "return_enrollment"
        | "end_enrollment";
    }
  >,
  access: PayrollAccess,
) {
  if (input.action === "create_plan") {
    if (!input.name || !input.type || !input.effectiveFrom)
      throw new PayrollServiceError(
        "VALIDATION_FAILED",
        "Plan name, type, and effective date are required.",
        422,
      );
    const rows = await prisma.$queryRawUnsafe<Row[]>(
      `INSERT INTO hr_benefit_plans
        (id, company_id, name, type, description, provider_code, employer_cost, employee_cost,
         effective_from, effective_to, is_active, eligibility_rules, version, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9::date, $10::date, $11,
               $12::jsonb, 1, now(), now()) RETURNING *`,
      randomUUID(),
      access.actorCompanyId,
      input.name,
      input.type,
      input.description || null,
      input.providerCode || null,
      input.employerCost,
      input.employeeCost,
      input.effectiveFrom,
      input.effectiveTo || null,
      input.isActive !== false,
      JSON.stringify(input.eligibilityRules || {}),
    );
    return rows[0];
  }
  if (input.action === "update_plan") {
    if (!input.id || !input.name || !input.type || !input.effectiveFrom)
      throw new PayrollServiceError(
        "VALIDATION_FAILED",
        "Plan id, name, type, and effective date are required.",
        422,
      );
    const rows = await prisma.$queryRawUnsafe<Row[]>(
      `UPDATE hr_benefit_plans SET name = $2, type = $3, description = COALESCE($4, description), provider_code = COALESCE($5, provider_code),
         employer_cost = $6, employee_cost = $7, effective_from = $8::date, effective_to = $9::date,
         is_active = COALESCE($10, is_active), eligibility_rules = eligibility_rules || COALESCE($11::jsonb, '{}'::jsonb), version = version + 1, updated_at = now()
       WHERE id = $1::uuid AND ($12::uuid IS NULL OR company_id = $12::uuid)
       RETURNING *`,
      input.id,
      input.name,
      input.type,
      input.description || null,
      input.providerCode || null,
      input.employerCost,
      input.employeeCost,
      input.effectiveFrom,
      input.effectiveTo || null,
      input.isActive ?? null,
      input.eligibilityRules ? JSON.stringify(input.eligibilityRules) : null,
      access.actorCompanyId,
    );
    if (!rows[0])
      throw new PayrollServiceError(
        "NOT_FOUND",
        "Benefit plan was not found.",
        404,
      );
    return rows[0];
  }
  if (input.action === "enroll") {
    let employeeIds = input.employeeIds?.length
      ? input.employeeIds
      : input.employeeId
        ? [input.employeeId]
        : [];
    if (!employeeIds.length || !input.benefitPlanId || !input.effectiveFrom)
      throw new PayrollServiceError(
        "VALIDATION_FAILED",
        "At least one employee, a plan, and an effective date are required.",
        422,
      );
    if (input.enrollmentMode === "rules") {
      const [planRows, employeeRows] = await Promise.all([
        prisma.$queryRawUnsafe<Row[]>(
          `SELECT eligibility_rules FROM hr_benefit_plans WHERE id = $1::uuid AND ($2::uuid IS NULL OR company_id = $2::uuid OR company_id IS NULL)`,
          input.benefitPlanId,
          access.actorCompanyId,
        ),
        prisma.$queryRawUnsafe<Row[]>(
          `SELECT id, employment_type, department_id, location, status, hire_date FROM hr_employees WHERE id = ANY($1::uuid[]) AND ($2::uuid IS NULL OR company_id = $2::uuid)`,
          employeeIds,
          access.actorCompanyId,
        ),
      ]);
      if (!planRows[0])
        throw new PayrollServiceError(
          "NOT_FOUND",
          "Benefit plan was not found.",
          404,
        );
      employeeIds = employeeRows
        .filter((employee) =>
          matchesBenefitRules(employee, planRows[0].eligibility_rules),
        )
        .map((employee) => String(employee.id));
      if (!employeeIds.length)
        throw new PayrollServiceError(
          "NO_ELIGIBLE_EMPLOYEES",
          "No selected employees meet the plan eligibility conditions.",
          422,
        );
    }
    const rows = await prisma.$queryRawUnsafe<Row[]>(
      `INSERT INTO hr_employee_benefit_enrollments
        (id, employee_id, benefit_plan_id, company_id, status, effective_from,
         employee_contribution, employer_contribution, enrolled_at, created_at, updated_at)
       SELECT gen_random_uuid(), employee.id, plan.id, employee.company_id,
              CASE WHEN COALESCE((plan.eligibility_rules->>'approvalRequired')::boolean, true) THEN 'pending_approval' ELSE 'active' END,
              $3::date,
              plan.employee_cost, plan.employer_cost, now(), now(), now()
       FROM hr_employees employee JOIN hr_benefit_plans plan ON plan.id = $2::uuid
         AND (plan.company_id IS NULL OR plan.company_id IS NOT DISTINCT FROM employee.company_id)
         AND plan.is_active = true
       WHERE employee.id = ANY($1::uuid[]) AND ($4::uuid IS NULL OR employee.company_id = $4::uuid)
       ON CONFLICT (employee_id, benefit_plan_id) DO UPDATE SET status = EXCLUDED.status,
         effective_from = EXCLUDED.effective_from, effective_to = NULL, ended_at = NULL,
         employee_contribution = EXCLUDED.employee_contribution, employer_contribution = EXCLUDED.employer_contribution,
         version = hr_employee_benefit_enrollments.version + 1, updated_at = now()
       RETURNING *`,
      employeeIds,
      input.benefitPlanId,
      input.effectiveFrom,
      access.actorCompanyId,
    );
    if (!rows[0])
      throw new PayrollServiceError(
        "SCOPE_VIOLATION",
        "Employee or plan is outside your company scope.",
        403,
      );
    return rows[0];
  }
  if (!input.id)
    throw new PayrollServiceError(
      "VALIDATION_FAILED",
      "Enrollment id is required.",
      422,
    );
  const status =
    input.action === "approve_enrollment"
      ? "active"
      : input.action === "return_enrollment"
        ? "returned_for_revision"
        : "ended";
  const allowedStatuses = [
    "pending_approval",
    "returned_for_revision",
    "active",
    "approved",
    "scheduled",
  ].filter((candidate) =>
    benefitEnrollmentTransitionAllowed(input.action, candidate),
  );
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `UPDATE hr_employee_benefit_enrollments enrollment SET status = $2,
       ended_at = CASE WHEN $2 = 'ended' THEN now() ELSE ended_at END,
       effective_to = CASE WHEN $2 = 'ended' THEN CURRENT_DATE ELSE effective_to END,
       version = version + 1, updated_at = now()
     FROM hr_employees employee WHERE enrollment.id = $1::uuid AND employee.id = enrollment.employee_id
       AND enrollment.status = ANY($4::text[])
       AND ($3::uuid IS NULL OR employee.company_id = $3::uuid) RETURNING enrollment.*`,
    input.id,
    status,
    access.actorCompanyId,
    allowedStatuses,
  );
  if (!rows[0])
    throw new PayrollServiceError(
      "NOT_FOUND",
      "Benefit enrollment was not found or is not in a valid state for this action.",
      409,
    );
  return rows[0];
}
