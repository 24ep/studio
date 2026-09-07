import type { Prisma } from '@prisma/client';

import { getPayrollOperationsConfig } from '@/lib/payroll-approval-route-config';

export function attendanceInputIdempotencyKey(
  exportId: string,
  attendanceRecordId: string,
  component: 'REGULAR_MINUTES' | 'OVERTIME_MINUTES',
  runId: string,
) {
  return `attendance-export:${exportId}:${attendanceRecordId}:${component}:${runId}`;
}

export async function collectAttendanceExportInputs(
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
  const overtimeMultiplier = operations.overtimeMultiplier ?? 1.5;
  const standardHoursPerDay = operations.standardHoursPerDay ?? 8;
  const salaryDaysPerMonth = operations.salaryDaysPerMonth ?? 30;

  const inserted = await client.$queryRawUnsafe<Record<string, unknown>[]>(
    `WITH ready_exports AS (
       SELECT export.id AS export_id, export.payload, period.company_id
       FROM hr_payroll_attendance_exports export
       JOIN hr_attendance_periods period ON period.id = export.attendance_period_id
       WHERE export.status = 'ready'
         AND period.start_date <= $4::date
         AND period.end_date >= $3::date
         AND ($2::uuid IS NULL OR period.company_id = $2::uuid OR period.company_id IS NULL)
     ), expanded AS (
       SELECT ready.export_id, ready.company_id,
              item->>'id' AS attendance_record_id,
              (item->>'employee_id')::uuid AS employee_id,
              (item->>'work_date')::date AS work_date,
              COALESCE((item->>'regular_minutes')::numeric, 0) AS regular_minutes,
              COALESCE((item->>'overtime_minutes')::numeric, 0) AS overtime_minutes
       FROM ready_exports ready
       CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ready.payload, '[]'::jsonb)) item
       WHERE item ? 'employee_id' AND item ? 'id' AND item ? 'work_date'
     ), scoped AS (
       SELECT expanded.*, employee.company_id AS employee_company_id,
              profile.payroll_group_id,
              package.base_salary,
              COALESCE(package.currency, profile.payment_currency, 'THB') AS currency,
              COALESCE(package.pay_frequency, 'monthly') AS compensation_frequency
       FROM expanded
       JOIN hr_employees employee ON employee.id = expanded.employee_id
       LEFT JOIN hr_employee_payroll_profiles profile
         ON profile.employee_id = employee.id AND profile.status = 'active'
       LEFT JOIN LATERAL (
         SELECT compensation.base_salary, compensation.currency, compensation.pay_frequency
         FROM hr_compensation_packages compensation
         WHERE compensation.employee_id = employee.id
           AND compensation.status = 'approved'
           AND compensation.effective_from <= expanded.work_date
           AND (compensation.effective_to IS NULL OR compensation.effective_to >= expanded.work_date)
         ORDER BY compensation.effective_from DESC
         LIMIT 1
       ) package ON true
       WHERE expanded.work_date BETWEEN $3::date AND $4::date
         AND ($2::uuid IS NULL OR employee.company_id = $2::uuid)
         AND ($6::uuid IS NULL OR profile.payroll_group_id = $6::uuid)
     ), time_rows AS (
       SELECT export_id, company_id, employee_company_id, attendance_record_id, employee_id,
              work_date, payroll_group_id, 'REGULAR_MINUTES'::text AS component_code,
              regular_minutes AS units, 0::numeric AS amount, 'time'::text AS input_type,
              currency, jsonb_build_object('units', regular_minutes, 'unit', 'minute', 'source', 'attendance') AS metadata
       FROM scoped WHERE regular_minutes > 0
       UNION ALL
       SELECT export_id, company_id, employee_company_id, attendance_record_id, employee_id,
              work_date, payroll_group_id, 'OVERTIME'::text AS component_code,
              overtime_minutes AS units,
              ROUND(
                (overtime_minutes / 60.0) *
                ((COALESCE(base_salary, 0) *
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
                  END) / $8::numeric / $7::numeric) * $9::numeric,
                2
              ) AS amount,
              'earning'::text AS input_type,
              currency,
              jsonb_build_object(
                'taxable', true,
                'statutoryCategory', 'overtime',
                'units', overtime_minutes,
                'unit', 'minute',
                'overtimeMultiplier', $9::numeric,
                'source', 'attendance'
              ) AS metadata
       FROM scoped
       WHERE overtime_minutes > 0 AND COALESCE(base_salary, 0) > 0
     )
     INSERT INTO hr_payroll_inputs
       (id, company_id, payroll_run_id, employee_id, input_type, component_code, amount, units,
        currency, source_module, source_record_id, effective_date, approval_status, status,
        idempotency_key, created_by_id, metadata)
     SELECT gen_random_uuid(), COALESCE(row.company_id, row.employee_company_id), $1::uuid,
            row.employee_id, row.input_type, row.component_code, row.amount, row.units, row.currency,
            'attendance', concat(row.export_id::text, ':', row.attendance_record_id), row.work_date,
            'approved', 'ready',
            concat('attendance-export:', row.export_id::text, ':', row.attendance_record_id, ':', row.component_code, ':', $1),
            $5::uuid, row.metadata
     FROM time_rows row
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
    overtimeMultiplier,
  );

  // An export may feed multiple payroll groups. Only mark it consumed after
  // every employee present in its payload has been collected by at least one run.
  await client.$executeRawUnsafe(
    `UPDATE hr_payroll_attendance_exports export
     SET status = 'consumed'
     WHERE export.status = 'ready'
       AND NOT EXISTS (
         SELECT 1
         FROM jsonb_array_elements(COALESCE(export.payload, '[]'::jsonb)) item
         WHERE item ? 'id'
           AND NOT EXISTS (
             SELECT 1 FROM hr_payroll_inputs payroll_input
             WHERE payroll_input.source_module = 'attendance'
               AND payroll_input.source_record_id = concat(export.id::text, ':', item->>'id')
           )
       )`,
  );

  return inserted;
}
