import { randomUUID } from 'crypto';
import { z } from 'zod';

import prisma from '../prisma';
import { availableLeaveBalance, prorateEntitlement } from './leave-domain';

export const leaveWorkspaceActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('request_decision'),
    id: z.string().uuid(),
    decision: z.enum(['approved', 'rejected', 'returned_for_revision']),
    comment: z.string().max(2000).optional().nullable(),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('create_encashment'),
    employeeId: z.string().uuid(),
    policyId: z.string().uuid(),
    requestedUnits: z.coerce.number().positive(),
    reason: z.string().min(1).max(1000),
    acknowledgment: z.literal(true),
    paymentDestinationRef: z.string().max(255).optional().nullable(),
  }),
  z.object({
    action: z.literal('encashment_decision'),
    id: z.string().uuid(),
    decision: z.enum(['approved', 'rejected', 'sent_to_payroll', 'paid', 'payment_failed']),
    comment: z.string().max(2000).optional().nullable(),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('assignment_preview'),
    policyId: z.string().uuid(),
    assignmentType: z.enum(['employee', 'company', 'business_unit', 'department', 'location', 'employment_type', 'work_schedule', 'all']),
    assignmentValue: z.string().max(255).optional().nullable(),
    effectiveFrom: z.string().min(1),
    effectiveTo: z.string().optional().nullable(),
    priority: z.coerce.number().int().min(1).max(999).default(100),
  }),
  z.object({
    action: z.literal('assignment_apply'),
    policyId: z.string().uuid(),
    assignmentType: z.enum(['employee', 'company', 'business_unit', 'department', 'location', 'employment_type', 'work_schedule', 'all']),
    assignmentValue: z.string().max(255).optional().nullable(),
    employeeIds: z.array(z.string().uuid()).min(1).max(1000),
    effectiveFrom: z.string().min(1),
    effectiveTo: z.string().optional().nullable(),
    priority: z.coerce.number().int().min(1).max(999).default(100),
    notes: z.string().max(1000).optional().nullable(),
  }),
  z.object({
    action: z.literal('allocation_preview'),
    policyId: z.string().uuid(),
    year: z.coerce.number().int().min(2000).max(2200),
    runType: z.enum(['annual_entitlement', 'monthly_accrual', 'prorated_allocation', 'carry_forward']),
  }),
  z.object({
    action: z.literal('allocation_run'),
    policyId: z.string().uuid(),
    year: z.coerce.number().int().min(2000).max(2200),
    runType: z.enum(['annual_entitlement', 'monthly_accrual', 'prorated_allocation', 'carry_forward']),
    employeeIds: z.array(z.string().uuid()).min(1).max(2000),
    idempotencyKey: z.string().min(8).max(200),
  }),
  z.object({
    action: z.literal('balance_adjustment'),
    employeeId: z.string().uuid(),
    policyId: z.string().uuid(),
    year: z.coerce.number().int().min(2000).max(2200),
    units: z.coerce.number().min(-365).max(365).refine(value => value !== 0),
    reason: z.string().min(3).max(1000),
    effectiveDate: z.string().min(1),
    idempotencyKey: z.string().min(8).max(200),
  }),
  z.object({
    action: z.literal('period_action'),
    periodId: z.string().uuid(),
    operation: z.enum(['close', 'reopen']),
    reason: z.string().min(3).max(1000),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('resolve_exception'),
    id: z.string().uuid(),
    resolution: z.string().min(3).max(2000),
  }),
]);

type Row = Record<string, unknown>;

async function safeQuery<T extends Row>(sql: string, ...values: unknown[]) {
  try {
    return await prisma.$queryRawUnsafe<T[]>(sql, ...values);
  } catch (error) {
    console.warn('[Leaves] Optional workspace query unavailable:', error instanceof Error ? error.message : error);
    return [];
  }
}

function count(rows: Array<{ count?: unknown }>) {
  return Number(rows[0]?.count || 0);
}

const EMPLOYEE_SELECT = `
  SELECT e.id, e.employee_number, e.first_name, e.last_name, e.email, e.status,
         e.employment_type, e.location, e.business_unit, e.department_id, e.company_id,
         COALESCE(d.name, d.department) AS department_name, c.name AS company_name
  FROM "hr_employees" e
  LEFT JOIN "hr_departments" d ON d.id = e.department_id
  LEFT JOIN "CompanyReference" c ON c.id = e.company_id
`;

async function getMetrics() {
  const [pending, overdue, negative, expiring, unassigned, encashments, exceptions, periods] = await Promise.all([
    safeQuery<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "hr_leave_requests" WHERE status IN ('pending', 'submitted', 'pending_approval', 'pending_manager_approval', 'pending_department_approval', 'pending_hr_approval')`),
    safeQuery<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "hr_leave_requests" WHERE status IN ('pending', 'submitted', 'pending_approval', 'pending_manager_approval') AND COALESCE(submitted_at, created_at) < CURRENT_TIMESTAMP - INTERVAL '3 days'`),
    safeQuery<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "hr_leave_balances" WHERE allocated + accrued + carry_forward - used - pending - reserved < 0`),
    safeQuery<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "hr_leave_balances" WHERE expiring > 0`),
    safeQuery<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "hr_employees" e WHERE e.status = 'active' AND NOT EXISTS (SELECT 1 FROM "hr_leave_policy_assignments" a WHERE a.employee_id = e.id AND a.status = 'active' AND a.effective_from <= CURRENT_DATE AND (a.effective_to IS NULL OR a.effective_to >= CURRENT_DATE))`),
    safeQuery<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "hr_leave_encashments" WHERE status IN ('submitted', 'pending_manager_approval', 'pending_hr_validation', 'pending_payroll_review', 'approved', 'reserved')`),
    safeQuery<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "hr_leave_exceptions" WHERE status = 'open'`),
    safeQuery<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "hr_leave_periods" WHERE status IN ('under_review', 'exceptions_pending', 'ready_to_close')`),
  ]);
  return {
    pendingRequests: count(pending),
    overdueApprovals: count(overdue),
    negativeBalances: count(negative),
    expiringBalances: count(expiring),
    unassignedEmployees: count(unassigned),
    pendingEncashments: count(encashments),
    openExceptions: count(exceptions),
    periodsAwaitingClosure: count(periods),
  };
}

export async function getLeaveWorkspace() {
  const [metrics, requests, balances, policies, employees, assignments, encashments, ledger, periods, exceptions, allocationRuns] = await Promise.all([
    getMetrics(),
    safeQuery<Row>(`
      SELECT lr.id, lr.request_id, lr.employee_id, lr.policy_id, lr.start_date, lr.end_date,
             lr.days, lr.reason, lr.status, lr.request_unit, lr.approver_comments,
             lr.submitted_at, lr.created_at, lr.version, lr.attendance_sync_status, lr.payroll_sync_status,
             e.employee_number, e.first_name, e.last_name, e.location,
             p.name AS policy_name, p.leave_type, p.payroll_impact
      FROM "hr_leave_requests" lr
      JOIN "hr_employees" e ON e.id = lr.employee_id
      LEFT JOIN "hr_leave_policies" p ON p.id = lr.policy_id
      ORDER BY COALESCE(lr.submitted_at, lr.created_at) DESC LIMIT 100
    `),
    safeQuery<Row>(`
      SELECT b.id, b.employee_id, b.policy_id, b.year, b.allocated, b.accrued, b.used, b.pending,
             b.reserved, b.carry_forward, b.expiring, b.version,
             b.allocated + b.accrued + b.carry_forward - b.used - b.pending - b.reserved AS available,
             e.employee_number, e.first_name, e.last_name,
             p.name AS policy_name, p.leave_type, p.encashment_eligible, p.minimum_retained_balance,
             p.maximum_encashment_units
      FROM "hr_leave_balances" b
      JOIN "hr_employees" e ON e.id = b.employee_id
      JOIN "hr_leave_policies" p ON p.id = b.policy_id
      ORDER BY e.first_name, e.last_name, p.name LIMIT 500
    `),
    safeQuery<Row>(`
      SELECT id, name, leave_type, annual_allowance, version, effective_from, effective_to,
             accrual_frequency, accrual_rate, carry_forward_limit, encashment_eligible,
             minimum_retained_balance, maximum_encashment_units, payroll_impact, is_active
      FROM "hr_leave_policies" ORDER BY is_active DESC, name
    `),
    safeQuery<Row>(`${EMPLOYEE_SELECT} WHERE e.status = 'active' ORDER BY e.first_name, e.last_name LIMIT 2000`),
    safeQuery<Row>(`
      SELECT a.id, a.policy_id, a.employee_id, a.assignment_type, a.assignment_value,
             a.effective_from, a.effective_to, a.priority, a.source, a.status, a.notes,
             p.name AS policy_name, e.employee_number, e.first_name, e.last_name
      FROM "hr_leave_policy_assignments" a
      JOIN "hr_leave_policies" p ON p.id = a.policy_id
      LEFT JOIN "hr_employees" e ON e.id = a.employee_id
      ORDER BY a.effective_from DESC LIMIT 300
    `),
    safeQuery<Row>(`
      SELECT ec.*, e.employee_number, e.first_name, e.last_name, p.name AS policy_name, p.leave_type
      FROM "hr_leave_encashments" ec
      JOIN "hr_employees" e ON e.id = ec.employee_id
      JOIN "hr_leave_policies" p ON p.id = ec.policy_id
      ORDER BY ec.created_at DESC LIMIT 200
    `),
    safeQuery<Row>(`
      SELECT l.*, e.employee_number, e.first_name, e.last_name, p.name AS policy_name
      FROM "hr_leave_balance_ledger" l
      JOIN "hr_employees" e ON e.id = l.employee_id
      JOIN "hr_leave_policies" p ON p.id = l.policy_id
      ORDER BY l.effective_date DESC, l.created_at DESC LIMIT 300
    `),
    safeQuery<Row>(`SELECT * FROM "hr_leave_periods" ORDER BY start_date DESC LIMIT 50`),
    safeQuery<Row>(`
      SELECT x.*, e.employee_number, e.first_name, e.last_name
      FROM "hr_leave_exceptions" x
      LEFT JOIN "hr_employees" e ON e.id = x.employee_id
      ORDER BY CASE x.severity WHEN 'critical' THEN 0 WHEN 'error' THEN 1 ELSE 2 END, x.created_at DESC LIMIT 200
    `),
    safeQuery<Row>(`SELECT * FROM "hr_leave_allocation_runs" ORDER BY created_at DESC LIMIT 50`),
  ]);

  return { metrics, requests, balances, policies, employees, assignments, encashments, ledger, periods, exceptions, allocationRuns };
}

export async function getLeaveRequestWorkspace() {
  const [requests, balances] = await Promise.all([
    safeQuery<Row>(`
      SELECT lr.id, lr.request_id, lr.employee_id, lr.policy_id, lr.start_date, lr.end_date,
             lr.days, lr.reason, lr.status, lr.request_unit, lr.approver_comments,
             lr.submitted_at, lr.created_at, lr.version, lr.attendance_sync_status, lr.payroll_sync_status,
             e.employee_number, e.first_name, e.last_name, e.location,
             p.name AS policy_name, p.leave_type, p.payroll_impact
      FROM "hr_leave_requests" lr
      JOIN "hr_employees" e ON e.id = lr.employee_id
      LEFT JOIN "hr_leave_policies" p ON p.id = lr.policy_id
      ORDER BY COALESCE(lr.submitted_at, lr.created_at) DESC LIMIT 100
    `),
    safeQuery<Row>(`
      SELECT b.id, b.employee_id, b.policy_id, b.year, b.allocated, b.accrued, b.used, b.pending,
             b.reserved, b.carry_forward, b.expiring, b.version,
             b.allocated + b.accrued + b.carry_forward - b.used - b.pending - b.reserved AS available,
             e.employee_number, e.first_name, e.last_name,
             p.name AS policy_name, p.leave_type, p.encashment_eligible, p.minimum_retained_balance,
             p.maximum_encashment_units
      FROM "hr_leave_balances" b
      JOIN "hr_employees" e ON e.id = b.employee_id
      JOIN "hr_leave_policies" p ON p.id = b.policy_id
      ORDER BY e.first_name, e.last_name, p.name LIMIT 500
    `),
  ]);

  return {
    metrics: {},
    requests,
    balances,
    policies: [],
    employees: [],
    assignments: [],
    encashments: [],
    ledger: [],
    periods: [],
    exceptions: [],
    allocationRuns: [],
  };
}

export async function getEmployeeEncashmentWorkspace(userId: string) {
  const employees = await safeQuery<Row>(`
    ${EMPLOYEE_SELECT}
    WHERE e.user_id = $1::uuid AND e.status = 'active'
    LIMIT 1
  `, userId);
  const employee = employees[0];
  if (!employee) throw new Error('No active employee record is linked to this account.');
  const [balances, policies, encashments] = await Promise.all([
    safeQuery<Row>(`
      SELECT b.id, b.employee_id, b.policy_id, b.year, b.allocated, b.accrued, b.used, b.pending,
             b.reserved, b.carry_forward, b.expiring, b.version,
             b.allocated + b.accrued + b.carry_forward - b.used - b.pending - b.reserved AS available,
             e.employee_number, e.first_name, e.last_name,
             p.name AS policy_name, p.leave_type, p.encashment_eligible, p.minimum_retained_balance,
             p.maximum_encashment_units
      FROM "hr_leave_balances" b
      JOIN "hr_employees" e ON e.id = b.employee_id
      JOIN "hr_leave_policies" p ON p.id = b.policy_id
      WHERE b.employee_id = $1::uuid
      ORDER BY b.year DESC, p.name
    `, employee.id),
    safeQuery<Row>(`
      SELECT p.id, p.name, p.leave_type, p.version, p.encashment_eligible,
             p.minimum_retained_balance, p.maximum_encashment_units
      FROM "hr_leave_policies" p
      WHERE p.encashment_eligible = true AND p.is_active = true
      ORDER BY p.name
    `),
    safeQuery<Row>(`
      SELECT ec.*, e.employee_number, e.first_name, e.last_name, p.name AS policy_name, p.leave_type
      FROM "hr_leave_encashments" ec
      JOIN "hr_employees" e ON e.id = ec.employee_id
      JOIN "hr_leave_policies" p ON p.id = ec.policy_id
      WHERE ec.employee_id = $1::uuid
      ORDER BY ec.created_at DESC
    `, employee.id),
  ]);
  return {
    metrics: {},
    requests: [],
    balances,
    policies,
    employees,
    assignments: [],
    encashments,
    ledger: [],
    periods: [],
    exceptions: [],
    allocationRuns: [],
  };
}

export async function previewPolicyAssignment(input: Extract<z.infer<typeof leaveWorkspaceActionSchema>, { action: 'assignment_preview' }>) {
  const value = input.assignmentValue || '';
  const predicates: Record<string, string> = {
    employee: 'e.id::text = $1',
    company: 'e.company_id::text = $1',
    business_unit: `lower(COALESCE(e.business_unit, '')) = lower($1)`,
    department: 'e.department_id::text = $1',
    location: `lower(COALESCE(e.location, '')) = lower($1)`,
    employment_type: `lower(e.employment_type) = lower($1)`,
    work_schedule: `EXISTS (SELECT 1 FROM "hr_shift_assignments" s WHERE s.employee_id = e.id AND s.schedule_id::text = $1)`,
    all: 'TRUE',
  };
  const matchedSql = `
    ${EMPLOYEE_SELECT}
    WHERE e.status = 'active' AND ${predicates[input.assignmentType]}
    ORDER BY e.first_name, e.last_name
  `;
  const matched = input.assignmentType === 'all'
    ? await safeQuery<Row>(matchedSql)
    : await safeQuery<Row>(matchedSql, value);
  const ids = matched.map(row => row.id);
  const existing = ids.length ? await safeQuery<Row>(`
    SELECT a.employee_id, a.policy_id, p.name AS policy_name
    FROM "hr_leave_policy_assignments" a
    JOIN "hr_leave_policies" p ON p.id = a.policy_id
    WHERE a.employee_id = ANY($1::uuid[]) AND a.status = 'active'
      AND a.effective_from <= $2::date
      AND (a.effective_to IS NULL OR a.effective_to >= $2::date)
  `, ids, input.effectiveFrom) : [];
  const existingByEmployee = new Map(existing.map(row => [String(row.employee_id), row]));
  return {
    matched: matched.map(employee => ({ ...employee, existingPolicy: existingByEmployee.get(String(employee.id)) || null })),
    matchedCount: matched.length,
    conflictCount: existing.filter(row => row.policy_id !== input.policyId).length,
    existingSamePolicyCount: existing.filter(row => row.policy_id === input.policyId).length,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo || null,
  };
}

export async function applyPolicyAssignment(
  input: Extract<z.infer<typeof leaveWorkspaceActionSchema>, { action: 'assignment_apply' }>,
  actorId: string,
) {
  const inserted: Row[] = [];
  await prisma.$transaction(async tx => {
    for (const employeeId of input.employeeIds) {
      const duplicate = await tx.$queryRawUnsafe<Row[]>(`
        SELECT id FROM "hr_leave_policy_assignments"
        WHERE employee_id = $1::uuid AND policy_id = $2::uuid AND status IN ('active', 'scheduled')
          AND daterange(effective_from::date, COALESCE(effective_to::date, 'infinity'::date), '[]')
              && daterange($3::date, COALESCE($4::date, 'infinity'::date), '[]')
        LIMIT 1 FOR UPDATE
      `, employeeId, input.policyId, input.effectiveFrom, input.effectiveTo || null);
      if (duplicate[0]) continue;
      const rows = await tx.$queryRawUnsafe<Row[]>(`
        INSERT INTO "hr_leave_policy_assignments"
          (id, policy_id, employee_id, assignment_type, assignment_value, effective_from, effective_to,
           priority, source, status, notes, created_by, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::date, $7::date, $8, 'rule_preview', 'active',
                $9, $10::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, randomUUID(), input.policyId, employeeId, input.assignmentType, input.assignmentValue || null,
      input.effectiveFrom, input.effectiveTo || null, input.priority, input.notes || null, actorId);
      inserted.push(rows[0]);
    }
  });
  return { applied: inserted.length, skipped: input.employeeIds.length - inserted.length, records: inserted };
}

export async function previewAllocation(input: Extract<z.infer<typeof leaveWorkspaceActionSchema>, { action: 'allocation_preview' }>) {
  const policyRows = await safeQuery<Row>(`SELECT * FROM "hr_leave_policies" WHERE id = $1::uuid AND is_active = true LIMIT 1`, input.policyId);
  const policy = policyRows[0];
  if (!policy) throw new Error('The selected leave policy is not active.');
  const employees = await safeQuery<Row>(`
    SELECT DISTINCT e.id, e.employee_number, e.first_name, e.last_name, e.hire_date,
      b.id AS balance_id, b.allocated, b.accrued, b.used, b.pending, b.reserved, b.carry_forward
    FROM "hr_leave_policy_assignments" a
    JOIN "hr_employees" e ON e.id = a.employee_id
    LEFT JOIN "hr_leave_balances" b ON b.employee_id = e.id AND b.policy_id = a.policy_id AND b.year = $2
    WHERE a.policy_id = $1::uuid AND a.status = 'active' AND e.status = 'active'
      AND a.effective_from <= make_date($2, 12, 31)
      AND (a.effective_to IS NULL OR a.effective_to >= make_date($2, 1, 1))
    ORDER BY e.first_name, e.last_name
  `, input.policyId, input.year);
  const annualAllowance = Number(policy.annual_allowance || 0);
  const accrualRate = Number(policy.accrual_rate || annualAllowance / 12);
  return {
    policy,
    employees: employees.map((employee): Row & { units: number } => {
      let units = annualAllowance;
      if (input.runType === 'monthly_accrual') units = accrualRate;
      if (input.runType === 'prorated_allocation' && employee.hire_date) {
        units = prorateEntitlement(annualAllowance, String(employee.hire_date), `${input.year}-12-31`);
      }
      if (input.runType === 'carry_forward') {
        units = Math.min(
          Math.max(0, availableLeaveBalance({
            allocated: Number(employee.allocated || 0),
            accrued: Number(employee.accrued || 0),
            carryForward: Number(employee.carry_forward || 0),
            used: Number(employee.used || 0),
            pending: Number(employee.pending || 0),
            reserved: Number(employee.reserved || 0),
          })),
          Number(policy.carry_forward_limit || 0),
        );
      }
      return { ...employee, units };
    }),
    year: input.year,
    runType: input.runType,
  };
}

export async function runAllocation(
  input: Extract<z.infer<typeof leaveWorkspaceActionSchema>, { action: 'allocation_run' }>,
  actorId: string,
) {
  const preview = await previewAllocation({ ...input, action: 'allocation_preview' });
  const selected = preview.employees.filter(employee => input.employeeIds.includes(String(employee.id)));
  const runUuid = randomUUID();
  const runId = `LAR-${runUuid.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  return prisma.$transaction(async tx => {
    const existing = await tx.$queryRawUnsafe<Row[]>(`SELECT * FROM "hr_leave_allocation_runs" WHERE idempotency_key = $1 LIMIT 1`, input.idempotencyKey);
    if (existing[0]) return { duplicate: true, run: existing[0] };
    await tx.$executeRawUnsafe(`
      INSERT INTO "hr_leave_allocation_runs"
        (id, run_id, run_type, period_year, policy_id, status, idempotency_key, input, summary,
         started_by, started_at, created_at)
      VALUES ($1::uuid, $2, $3, $4, $5::uuid, 'processing', $6, $7::jsonb, '{}'::jsonb,
              $8::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, runUuid, runId, input.runType, input.year, input.policyId, input.idempotencyKey,
    JSON.stringify({ employeeIds: input.employeeIds }), actorId);
    let processed = 0;
    for (const employee of selected) {
      const balanceId = String(employee.balance_id || randomUUID());
      await tx.$executeRawUnsafe(`
        INSERT INTO "hr_leave_balances"
          (id, employee_id, policy_id, year, allocated, accrued, used, pending, reserved,
           carry_forward, expiring, version, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4,
                CASE WHEN $5 IN ('annual_entitlement', 'prorated_allocation') THEN $6 ELSE 0 END,
                CASE WHEN $5 = 'monthly_accrual' THEN $6 ELSE 0 END,
                0, 0, 0, CASE WHEN $5 = 'carry_forward' THEN $6 ELSE 0 END, 0, 1,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (employee_id, policy_id, year) DO UPDATE SET
          allocated = CASE WHEN $5 IN ('annual_entitlement', 'prorated_allocation') THEN EXCLUDED.allocated ELSE hr_leave_balances.allocated END,
          accrued = CASE WHEN $5 = 'monthly_accrual' THEN hr_leave_balances.accrued + EXCLUDED.accrued ELSE hr_leave_balances.accrued END,
          carry_forward = CASE WHEN $5 = 'carry_forward' THEN EXCLUDED.carry_forward ELSE hr_leave_balances.carry_forward END,
          version = hr_leave_balances.version + 1,
          updated_at = CURRENT_TIMESTAMP
      `, balanceId, employee.id, input.policyId, input.year, input.runType, Number(employee.units));
      const balanceRows = await tx.$queryRawUnsafe<Row[]>(`
        SELECT id, allocated + accrued + carry_forward - used - pending - reserved AS available
        FROM "hr_leave_balances" WHERE employee_id = $1::uuid AND policy_id = $2::uuid AND year = $3
      `, employee.id, input.policyId, input.year);
      const after = Number(balanceRows[0]?.available || 0);
      await tx.$executeRawUnsafe(`
        INSERT INTO "hr_leave_balance_ledger"
          (id, employee_id, policy_id, balance_id, transaction_type, units, balance_before,
           balance_after, effective_date, source_type, source_id, idempotency_key, actor_id, metadata, created_at)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, make_date($9, 1, 1),
                'allocation_run', $10::uuid, $11, $12::uuid, $13::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (idempotency_key) DO NOTHING
      `, randomUUID(), employee.id, input.policyId, balanceRows[0]?.id || balanceId, input.runType,
      Number(employee.units), after - Number(employee.units), after, input.year, runUuid,
      `${input.idempotencyKey}:${employee.id}`, actorId, JSON.stringify({ runId }));
      processed += 1;
    }
    const summary = { processed, skipped: input.employeeIds.length - processed, units: selected.reduce((sum, employee) => sum + Number(employee.units), 0) };
    const rows = await tx.$queryRawUnsafe<Row[]>(`
      UPDATE "hr_leave_allocation_runs"
      SET status = 'completed', summary = $2::jsonb, completed_at = CURRENT_TIMESTAMP
      WHERE id = $1::uuid RETURNING *
    `, runUuid, JSON.stringify(summary));
    return { duplicate: false, run: rows[0], summary };
  });
}

export async function createEncashment(
  input: Extract<z.infer<typeof leaveWorkspaceActionSchema>, { action: 'create_encashment' }>,
  actorId: string,
) {
  const id = randomUUID();
  const requestId = `LEC-${id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Row[]>(`
      SELECT b.id, b.allocated, b.accrued, b.used, b.pending, b.reserved, b.carry_forward,
             p.encashment_eligible, p.minimum_retained_balance, p.maximum_encashment_units
      FROM "hr_leave_balances" b
      JOIN "hr_leave_policies" p ON p.id = b.policy_id
      WHERE b.employee_id = $1::uuid AND b.policy_id = $2::uuid AND b.year = $3
      FOR UPDATE
    `, input.employeeId, input.policyId, new Date().getFullYear());
    const balance = rows[0];
    if (!balance || !balance.encashment_eligible) throw new Error('This leave balance is not eligible for encashment.');
    const available = availableLeaveBalance({
      allocated: Number(balance.allocated), accrued: Number(balance.accrued), carryForward: Number(balance.carry_forward),
      used: Number(balance.used), pending: Number(balance.pending), reserved: Number(balance.reserved),
    });
    const maximum = Math.min(
      Math.max(0, available - Number(balance.minimum_retained_balance || 0)),
      Number(balance.maximum_encashment_units || Number.POSITIVE_INFINITY),
    );
    if (input.requestedUnits > maximum) throw new Error(`The maximum encashable balance is ${maximum} unit(s).`);
    await tx.$executeRawUnsafe(`
      INSERT INTO "hr_leave_encashments"
        (id, request_id, employee_id, policy_id, requested_units, unit_type, period_year, reason,
         payment_destination_ref, status, acknowledgment_at, submitted_at, created_by, created_at, updated_at)
      VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5, 'days', $6, $7, $8, 'pending_hr_validation',
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $9::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, id, requestId, input.employeeId, input.policyId, input.requestedUnits, new Date().getFullYear(),
    input.reason, input.paymentDestinationRef || null, actorId);
    await tx.$executeRawUnsafe(`UPDATE "hr_leave_balances" SET reserved = reserved + $2, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1::uuid`, balance.id, input.requestedUnits);
    await tx.$executeRawUnsafe(`
      INSERT INTO "hr_leave_reservations" (id, employee_id, policy_id, source_type, source_id, units, status, created_at)
      VALUES ($1::uuid, $2::uuid, $3::uuid, 'encashment', $4::uuid, $5, 'active', CURRENT_TIMESTAMP)
    `, randomUUID(), input.employeeId, input.policyId, id, input.requestedUnits);
    return { id, requestId, status: 'pending_hr_validation', maximum };
  });
}

export async function adjustBalance(
  input: Extract<z.infer<typeof leaveWorkspaceActionSchema>, { action: 'balance_adjustment' }>,
  actorId: string,
) {
  return prisma.$transaction(async tx => {
    const duplicate = await tx.$queryRawUnsafe<Row[]>(`SELECT * FROM "hr_leave_balance_ledger" WHERE idempotency_key = $1 LIMIT 1`, input.idempotencyKey);
    if (duplicate[0]) return { duplicate: true, ledger: duplicate[0] };
    const rows = await tx.$queryRawUnsafe<Row[]>(`
      SELECT id, allocated + accrued + carry_forward - used - pending - reserved AS available
      FROM "hr_leave_balances"
      WHERE employee_id = $1::uuid AND policy_id = $2::uuid AND year = $3 FOR UPDATE
    `, input.employeeId, input.policyId, input.year);
    const balance = rows[0];
    if (!balance) throw new Error('No leave balance exists for this employee, policy, and year.');
    const before = Number(balance.available || 0);
    const after = before + input.units;
    await tx.$executeRawUnsafe(`
      UPDATE "hr_leave_balances"
      SET allocated = allocated + $2, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::uuid
    `, balance.id, input.units);
    const ledgerRows = await tx.$queryRawUnsafe<Row[]>(`
      INSERT INTO "hr_leave_balance_ledger"
        (id, employee_id, policy_id, balance_id, transaction_type, units, balance_before,
         balance_after, effective_date, source_type, idempotency_key, reason, actor_id, created_at)
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'manual_adjustment', $5, $6, $7,
              $8::date, 'manual', $9, $10, $11::uuid, CURRENT_TIMESTAMP)
      RETURNING *
    `, randomUUID(), input.employeeId, input.policyId, balance.id, input.units, before, after,
    input.effectiveDate, input.idempotencyKey, input.reason, actorId);
    return { duplicate: false, ledger: ledgerRows[0] };
  });
}

export async function decideRequest(
  input: Extract<z.infer<typeof leaveWorkspaceActionSchema>, { action: 'request_decision' }>,
  actorId: string,
) {
  if (input.decision !== 'approved' && !input.comment?.trim()) throw new Error('A reason is required when rejecting or returning a request.');
  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Row[]>(`
      SELECT lr.*, b.id AS balance_id,
             b.allocated + b.accrued + b.carry_forward - b.used - b.pending - b.reserved AS available
      FROM "hr_leave_requests" lr
      LEFT JOIN "hr_leave_balances" b ON b.employee_id = lr.employee_id AND b.policy_id = lr.policy_id
        AND b.year = EXTRACT(YEAR FROM lr.start_date)
      WHERE lr.id = $1::uuid AND lr.status IN ('pending', 'submitted', 'pending_approval',
        'pending_manager_approval', 'pending_department_approval', 'pending_hr_approval')
      FOR UPDATE OF lr
    `, input.id);
    const request = rows[0];
    if (!request || Number(request.version) !== input.expectedVersion) return null;
    await tx.$executeRawUnsafe(`
      UPDATE "hr_leave_requests"
      SET status = $2, approver_id = $3::uuid, approver_comments = $4, decided_at = CURRENT_TIMESTAMP,
          attendance_sync_status = CASE WHEN $2 = 'approved' THEN 'queued' ELSE attendance_sync_status END,
          payroll_sync_status = CASE WHEN $2 = 'approved' AND payroll_sync_status <> 'not_required' THEN 'queued' ELSE payroll_sync_status END,
          version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::uuid
    `, input.id, input.decision, actorId, input.comment || null);
    if (request.balance_id) {
      const before = Number(request.available || 0);
      const after = input.decision === 'approved' ? before : before + Number(request.days);
      await tx.$executeRawUnsafe(`
        UPDATE "hr_leave_balances"
        SET pending = GREATEST(0, pending - $2),
            used = used + CASE WHEN $3 = 'approved' THEN $2 ELSE 0 END,
            version = version + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid
      `, request.balance_id, Number(request.days), input.decision);
      await tx.$executeRawUnsafe(`
        INSERT INTO "hr_leave_balance_ledger"
          (id, employee_id, policy_id, balance_id, transaction_type, units, balance_before,
           balance_after, effective_date, source_type, source_id, idempotency_key, reason, actor_id, created_at)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, CURRENT_DATE,
                'leave_request', $9::uuid, $10, $11, $12::uuid, CURRENT_TIMESTAMP)
        ON CONFLICT (idempotency_key) DO NOTHING
      `, randomUUID(), request.employee_id, request.policy_id, request.balance_id,
      input.decision === 'approved' ? 'leave_usage_deduction' : 'request_reservation_release',
      input.decision === 'approved' ? -Number(request.days) : Number(request.days), before, after,
      input.id, `leave-request-decision:${input.id}:${input.expectedVersion}`, input.comment || null, actorId);
    }
    return { id: input.id, status: input.decision };
  });
}

export async function decideEncashment(
  input: Extract<z.infer<typeof leaveWorkspaceActionSchema>, { action: 'encashment_decision' }>,
  actorId: string,
) {
  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Row[]>(`
      SELECT ec.*, b.id AS balance_id,
             b.allocated + b.accrued + b.carry_forward - b.used - b.pending - b.reserved AS available
      FROM "hr_leave_encashments" ec
      JOIN "hr_leave_balances" b ON b.employee_id = ec.employee_id AND b.policy_id = ec.policy_id AND b.year = ec.period_year
      WHERE ec.id = $1::uuid FOR UPDATE OF ec, b
    `, input.id);
    const current = rows[0];
    if (!current || Number(current.version) !== input.expectedVersion) return null;
    const statusMap = { approved: 'approved', rejected: 'rejected', sent_to_payroll: 'sent_to_payroll', paid: 'paid', payment_failed: 'payment_failed' };
    const release = ['rejected', 'payment_failed'].includes(input.decision);
    const deduct = input.decision === 'paid';
    const units = Number(current.approved_units || current.requested_units);
    if (release || deduct) {
      await tx.$executeRawUnsafe(`
        UPDATE "hr_leave_balances"
        SET reserved = GREATEST(0, reserved - $2),
            used = used + CASE WHEN $3 THEN $2 ELSE 0 END,
            version = version + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid
      `, current.balance_id, units, deduct);
      await tx.$executeRawUnsafe(`
        UPDATE "hr_leave_reservations"
        SET status = $2, released_at = CURRENT_TIMESTAMP
        WHERE source_type = 'encashment' AND source_id = $1::uuid AND status = 'active'
      `, input.id, deduct ? 'consumed' : 'released');
    }
    await tx.$executeRawUnsafe(`
      UPDATE "hr_leave_encashments"
      SET status = $2, approved_units = CASE WHEN $2 = 'approved' THEN requested_units ELSE approved_units END,
          payroll_status = CASE WHEN $2 = 'sent_to_payroll' THEN 'sent'
                                WHEN $2 = 'paid' THEN 'paid'
                                WHEN $2 = 'payment_failed' THEN 'failed' ELSE payroll_status END,
          decided_at = CASE WHEN $2 IN ('approved', 'rejected') THEN CURRENT_TIMESTAMP ELSE decided_at END,
          version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::uuid
    `, input.id, statusMap[input.decision]);
    if (deduct || release) {
      const before = Number(current.available || 0);
      const after = deduct ? before : before + units;
      await tx.$executeRawUnsafe(`
        INSERT INTO "hr_leave_balance_ledger"
          (id, employee_id, policy_id, balance_id, transaction_type, units, balance_before,
           balance_after, effective_date, source_type, source_id, idempotency_key, reason, actor_id, created_at)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, CURRENT_DATE,
                'encashment', $9::uuid, $10, $11, $12::uuid, CURRENT_TIMESTAMP)
        ON CONFLICT (idempotency_key) DO NOTHING
      `, randomUUID(), current.employee_id, current.policy_id, current.balance_id,
      deduct ? 'encashment_deduction' : 'encashment_reservation_release', deduct ? -units : units,
      before, after, input.id, `encashment:${input.id}:${input.expectedVersion}`, input.comment || null, actorId);
    }
    return { id: input.id, status: statusMap[input.decision] };
  });
}

export async function updatePeriod(
  input: Extract<z.infer<typeof leaveWorkspaceActionSchema>, { action: 'period_action' }>,
  actorId: string,
) {
  return prisma.$transaction(async tx => {
    const periods = await tx.$queryRawUnsafe<Row[]>(`SELECT * FROM "hr_leave_periods" WHERE id = $1::uuid FOR UPDATE`, input.periodId);
    const period = periods[0];
    if (!period || Number(period.version) !== input.expectedVersion) return null;
    if (input.operation === 'close') {
      const blockers = await tx.$queryRawUnsafe<Array<{ count: number }>>(`
        SELECT COUNT(*)::int AS count FROM "hr_leave_requests"
        WHERE status IN ('draft', 'submitted', 'pending', 'pending_approval', 'cancellation_requested')
          AND start_date <= $2 AND end_date >= $1
      `, period.start_date, period.end_date);
      if (Number(blockers[0]?.count || 0) > 0) throw new Error(`${blockers[0].count} unresolved leave request(s) block period closure.`);
    }
    const rows = await tx.$queryRawUnsafe<Row[]>(`
      UPDATE "hr_leave_periods"
      SET status = $2,
          closed_at = CASE WHEN $2 = 'closed' THEN CURRENT_TIMESTAMP ELSE closed_at END,
          closed_by = CASE WHEN $2 = 'closed' THEN $3::uuid ELSE closed_by END,
          reopened_at = CASE WHEN $2 = 'reopened' THEN CURRENT_TIMESTAMP ELSE reopened_at END,
          reopened_by = CASE WHEN $2 = 'reopened' THEN $3::uuid ELSE reopened_by END,
          reason = $4, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::uuid RETURNING *
    `, input.periodId, input.operation === 'close' ? 'closed' : 'reopened', actorId, input.reason);
    return rows[0];
  });
}

export async function resolveLeaveException(id: string, resolution: string, actorId: string) {
  const rows = await prisma.$queryRawUnsafe<Row[]>(`
    UPDATE "hr_leave_exceptions"
    SET status = 'resolved', resolution = $2, resolved_by = $3::uuid,
        resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1::uuid AND status = 'open' RETURNING *
  `, id, resolution, actorId);
  return rows[0] || null;
}
