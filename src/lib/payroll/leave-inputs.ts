import type { Prisma } from '@prisma/client';

import { getPayrollOperationsConfig } from '@/lib/payroll-approval-route-config';

/**
 * Converts approved unpaid leave into a pre-tax payroll deduction. The input is
 * company and payroll-group scoped and idempotent per run/request, so split
 * payroll groups cannot consume one another's leave data.
 */
export async function collectLeavePayrollInputs(
  client: Prisma.TransactionClient,
  input: {
    runId: string;
    companyId: string | null;
    payrollGroupId?: string | null;
    start: string;
    end: string;
    actorId: string;
  },
) {
  const operations = await getPayrollOperationsConfig();
  const standardHoursPerDay = operations.standardHoursPerDay ?? 8;
  const salaryDaysPerMonth = operations.salaryDaysPerMonth ?? 30;

  return client.$queryRawUnsafe<Record<string, unknown>[]>(
    `WITH unpaid_leave AS (
       SELECT request.id AS leave_request_id,
              request.employee_id,
              request.start_date,
              request.end_date,
              COALESCE(request.days, 0)::numeric AS leave_days,
              COALESCE(request.requested_hours, 0)::numeric AS requested_hours,
              COALESCE(request.request_unit, 'full_day') AS request_unit,
              employee.company_id,
              profile.payroll_group_id,
              compensation.base_salary,
              COALESCE(compensation.currency, profile.payment_currency, 'THB') AS currency,
              COALESCE(compensation.pay_frequency, 'monthly') AS compensation_frequency
       FROM hr_leave_requests request
       LEFT JOIN hr_leave_policies policy ON policy.id = request.policy_id
       JOIN hr_employees employee ON employee.id = request.employee_id
       LEFT JOIN hr_employee_payroll_profiles profile
         ON profile.employee_id = employee.id AND profile.status = 'active'
       LEFT JOIN LATERAL (
         SELECT package.base_salary, package.currency, package.pay_frequency
         FROM hr_compensation_packages package
         WHERE package.employee_id = employee.id
           AND package.status = 'approved'
           AND package.effective_from <= LEAST(request.end_date, $4::date)
           AND (package.effective_to IS NULL OR package.effective_to >= GREATEST(request.start_date, $3::date))
         ORDER BY package.effective_from DESC
         LIMIT 1
       ) compensation ON true
       WHERE request.status = 'approved'
         AND request.start_date <= $4::date
         AND request.end_date >= $3::date
         AND ($2::uuid IS NULL OR employee.company_id = $2::uuid)
         AND ($6::uuid IS NULL OR profile.payroll_group_id = $6::uuid)
         AND (
           lower(replace(COALESCE(policy.leave_type, ''), ' ', '_')) IN
             ('unpaid', 'unpaid_leave', 'leave_without_pay', 'leave_without_pay_lwop', 'lwop')
           OR lower(COALESCE(policy.name, '')) LIKE '%unpaid%'
           OR lower(COALESCE(policy.name, '')) LIKE '%without pay%'
         )
     ), valued AS (
       SELECT unpaid_leave.*,
              CASE
                WHEN request_unit = 'hourly' AND requested_hours > 0
                  THEN requested_hours / $7::numeric
                ELSE leave_days
              END AS equivalent_days,
              COALESCE(base_salary, 0) *
                CASE lower(replace(compensation_frequency, '-', '_'))
                  WHEN 'annual' THEN 1.0 / 12.0
                  WHEN 'annually' THEN 1.0 / 12.0
                  WHEN 'yearly' THEN 1.0 / 12.0
                  WHEN 'weekly' THEN 52.0 / 12.0
                  WHEN 'week' THEN 52.0 / 12.0
                  WHEN 'biweekly' THEN 26.0 / 12.0
                  WHEN 'bi_weekly' THEN 26.0 / 12.0
                  WHEN 'fortnightly' THEN 26.0 / 12.0
                  WHEN 'semimonthly' THEN 24.0 / 12.0
                  WHEN 'semi_monthly' THEN 24.0 / 12.0
                  WHEN 'twice_monthly' THEN 24.0 / 12.0
                  WHEN 'quarterly' THEN 4.0 / 12.0
                  WHEN 'quarter' THEN 4.0 / 12.0
                  ELSE 1.0
                END AS monthly_salary
       FROM unpaid_leave
     )
     INSERT INTO hr_payroll_inputs
       (id, company_id, payroll_run_id, employee_id, input_type, component_code,
        amount, units, currency, source_module, source_record_id, effective_date,
        approval_status, status, idempotency_key, created_by_id, metadata)
     SELECT gen_random_uuid(), company_id, $1::uuid, employee_id,
            'pre_tax_deduction', 'UNPAID_LEAVE',
            ROUND((monthly_salary / $8::numeric) * equivalent_days, 2),
            equivalent_days, currency, 'leave', leave_request_id::text,
            GREATEST(start_date, $3::date), 'approved', 'ready',
            concat('leave-request:', leave_request_id::text, ':', $1), $5::uuid,
            jsonb_build_object(
              'taxable', false,
              'source', 'leave',
              'leaveRequestId', leave_request_id,
              'equivalentDays', equivalent_days,
              'salaryDaysPerMonth', $8::numeric
            )
     FROM valued
     WHERE equivalent_days > 0 AND monthly_salary > 0
     ON CONFLICT (company_id, idempotency_key) DO NOTHING
     RETURNING *`,
    input.runId,
    input.companyId,
    input.start,
    input.end,
    input.actorId,
    input.payrollGroupId || null,
    standardHoursPerDay,
    salaryDaysPerMonth,
  );
}
