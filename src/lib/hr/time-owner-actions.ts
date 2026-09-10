import { randomUUID } from 'crypto';

import prisma from '@/lib/prisma';
import { resolveShiftWindow } from './attendance-calculation';
import { overtimeOwnerTransition, type OvertimeOwnerAction } from './overtime-request-workflow';
import { getTimePolicyConfig, timezoneOffsetMinutesForDate } from './time-policy-config';
import { rosterCopyTargetDate } from './roster-copy';
import {
  shiftRequestOwnerTransition,
  validateShiftRequestTarget,
  type ShiftRequestOwnerAction,
  type ShiftRequestType,
} from './shift-request-workflow';

export type TimeActionActor = {
  user: { id: string };
  employee: { id: string; company_id: string | null } | null;
  canManageWorkforce: boolean;
  companyId: string | null;
};

type ShiftRequestUpdate = {
  action: 'update_shift_request';
  requestId: string;
  requestType: ShiftRequestType;
  assignmentId?: string | null;
  requestedAssignmentId?: string | null;
  openShiftId?: string | null;
  swapEmployeeId?: string | null;
  effectiveStart: string;
  effectiveEnd: string;
  workLocation?: string | null;
  reason: string;
  expectedVersion: number;
};

type ShiftRequestTransition = {
  action: Exclude<ShiftRequestOwnerAction, 'update_shift_request'>;
  requestId: string;
  expectedVersion: number;
};

type OvertimeUpdate = {
  action: 'update_overtime';
  overtimeId: string;
  date: string;
  assignmentId?: string | null;
  startAt: string;
  endAt: string;
  breakMinutes: number;
  overtimeType: string;
  reason: string;
  project?: string | null;
  costCenter?: string | null;
  workLocation?: string | null;
  compensationMethod: string;
  expectedVersion: number;
};

type OvertimeTransition = {
  action: Exclude<OvertimeOwnerAction, 'update_overtime'>;
  overtimeId: string;
  expectedVersion: number;
};

type CopyRosterInput = {
  action: 'copy_roster';
  sourceStart: string;
  targetStart: string;
  reason: string;
};

function requireEmployee(actor: TimeActionActor) {
  if (!actor.employee) throw new Error('NO_EMPLOYEE');
  return actor.employee;
}

async function assertOwnedAssignment(employeeId: string, assignmentId: string | null | undefined) {
  if (!assignmentId) return;
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "hr_shift_assignments"
     WHERE id = $1::uuid AND employee_id = $2::uuid AND status <> 'cancelled' LIMIT 1`,
    assignmentId,
    employeeId,
  );
  if (!rows[0]) throw new Error('FORBIDDEN');
}

export async function validateOwnedShiftRequestTargets(employeeId: string, input: {
  requestType: ShiftRequestType;
  assignmentId?: string | null;
  requestedAssignmentId?: string | null;
  openShiftId?: string | null;
  swapEmployeeId?: string | null;
}) {
  const targetError = validateShiftRequestTarget(input);
  if (targetError) throw new Error('INVALID_TRANSITION');
  await assertOwnedAssignment(employeeId, input.assignmentId);

  if (input.requestType === 'shift_swap') {
    const rows = await prisma.$queryRawUnsafe<{ id: string; employee_id: string }[]>(
      `SELECT id, employee_id FROM "hr_shift_assignments"
       WHERE id = $1::uuid AND employee_id = $2::uuid AND status <> 'cancelled' LIMIT 1`,
      input.requestedAssignmentId,
      input.swapEmployeeId,
    );
    if (!rows[0]) throw new Error('SHIFT_CONFLICT');
  }

  if (input.requestType === 'cover_shift' && input.requestedAssignmentId) {
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT sa.id FROM "hr_shift_assignments" sa
       JOIN "hr_employees" e ON e.id = sa.employee_id
       WHERE sa.id = $1::uuid AND sa.employee_id <> $2::uuid AND sa.status <> 'cancelled'
       LIMIT 1`,
      input.requestedAssignmentId,
      employeeId,
    );
    if (!rows[0]) throw new Error('SHIFT_CONFLICT');
  }

  if (input.openShiftId) {
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT os.id FROM "hr_open_shifts" os
       LEFT JOIN "hr_roster_periods" rp ON rp.id = os.roster_period_id
       WHERE os.id = $1::uuid AND os.status = 'open'
         AND COALESCE(os.headcount_assigned, 0) < os.headcount_required
       LIMIT 1`,
      input.openShiftId,
    );
    if (!rows[0]) throw new Error('SHIFT_CONFLICT');
  }
}

export async function mutateOwnedShiftRequest(
  actor: TimeActionActor,
  input: ShiftRequestUpdate | ShiftRequestTransition,
) {
  const employee = requireEmployee(actor);
  return prisma.$transaction(async tx => {
    const requests = await tx.$queryRawUnsafe<Array<{
      id: string;
      employee_id: string;
      request_type: ShiftRequestType;
      assignment_id: string | null;
      requested_assignment_id: string | null;
      open_shift_id: string | null;
      swap_employee_id: string | null;
      status: string;
      version: number;
    }>>(
      `SELECT id, employee_id, request_type, assignment_id, requested_assignment_id,
              open_shift_id, swap_employee_id, status, version
       FROM "hr_shift_requests" WHERE id = $1::uuid FOR UPDATE`,
      input.requestId,
    );
    const request = requests[0];
    if (!request) throw new Error('NOT_FOUND');
    if (request.employee_id !== employee.id) throw new Error('FORBIDDEN');
    if (request.version !== input.expectedVersion) throw new Error('CONFLICT');

    if (input.action === 'update_shift_request') {
      if (input.effectiveEnd < input.effectiveStart) throw new Error('INVALID_DATE_RANGE');
      if (!shiftRequestOwnerTransition(request.status, input.action, input.requestType)) throw new Error('INVALID_TRANSITION');
      await validateOwnedShiftRequestTargets(employee.id, input);
      const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_shift_requests"
         SET request_type = $2, assignment_id = $3::uuid, requested_assignment_id = $4::uuid,
             open_shift_id = $5::uuid, swap_employee_id = $6::uuid,
             effective_start = $7::date, effective_end = $8::date,
             work_location = $9, reason = $10, colleague_accepted_at = NULL,
             version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid AND version = $11 RETURNING *`,
        input.requestId,
        input.requestType,
        input.assignmentId || null,
        input.requestedAssignmentId || null,
        input.openShiftId || null,
        input.swapEmployeeId || null,
        input.effectiveStart,
        input.effectiveEnd,
        input.workLocation || null,
        input.reason,
        input.expectedVersion,
      );
      if (!rows[0]) throw new Error('CONFLICT');
      return rows[0];
    }

    const next = shiftRequestOwnerTransition(request.status, input.action, request.request_type);
    if (!next) throw new Error('INVALID_TRANSITION');
    if (input.action === 'submit_shift_request' || input.action === 'resubmit_shift_request') {
      await validateOwnedShiftRequestTargets(employee.id, {
        requestType: request.request_type,
        assignmentId: request.assignment_id,
        requestedAssignmentId: request.requested_assignment_id,
        openShiftId: request.open_shift_id,
        swapEmployeeId: request.swap_employee_id,
      });
    }
    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_shift_requests"
       SET status = $2,
           colleague_accepted_at = CASE WHEN $2 = 'awaiting_employee' THEN NULL ELSE colleague_accepted_at END,
           version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid AND version = $3 RETURNING *`,
      input.requestId,
      next,
      input.expectedVersion,
    );
    if (!rows[0]) throw new Error('CONFLICT');
    return rows[0];
  });
}

export async function mutateOwnedOvertime(
  actor: TimeActionActor,
  input: OvertimeUpdate | OvertimeTransition,
) {
  const employee = requireEmployee(actor);
  return prisma.$transaction(async tx => {
    const requests = await tx.$queryRawUnsafe<Array<{
      id: string;
      employee_id: string;
      status: string;
      version: number;
    }>>(
      `SELECT id, employee_id, status, version FROM "hr_overtime_requests"
       WHERE id = $1::uuid FOR UPDATE`,
      input.overtimeId,
    );
    const request = requests[0];
    if (!request) throw new Error('NOT_FOUND');
    if (request.employee_id !== employee.id) throw new Error('FORBIDDEN');
    if (request.version !== input.expectedVersion) throw new Error('CONFLICT');

    if (input.action === 'update_overtime') {
      if (!overtimeOwnerTransition(request.status, input.action)) throw new Error('INVALID_TRANSITION');
      const start = new Date(input.startAt);
      const end = new Date(input.endAt);
      if (end <= start) throw new Error('INVALID_TRANSITION');
      if (input.assignmentId) await assertOwnedAssignment(employee.id, input.assignmentId);
      const overlaps = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "hr_overtime_requests"
         WHERE employee_id = $1::uuid AND id <> $2::uuid
           AND status NOT IN ('rejected', 'withdrawn', 'cancelled')
           AND requested_start_at < $4 AND requested_end_at > $3 LIMIT 1`,
        employee.id,
        input.overtimeId,
        start,
        end,
      );
      if (overlaps[0]) throw new Error('OVERTIME_CONFLICT');
      const requestedMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000) - input.breakMinutes);
      const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_overtime_requests"
         SET assignment_id = $2::uuid, work_date = $3::date, overtime_type = $4,
             requested_start_at = $5, requested_end_at = $6, requested_minutes = $7,
             break_minutes = $8, business_reason = $9, project = $10,
             cost_center = $11, work_location = $12, compensation_method = $13,
             version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid AND version = $14 RETURNING *`,
        input.overtimeId,
        input.assignmentId || null,
        input.date,
        input.overtimeType,
        start,
        end,
        requestedMinutes,
        input.breakMinutes,
        input.reason,
        input.project || null,
        input.costCenter || null,
        input.workLocation || null,
        input.compensationMethod,
        input.expectedVersion,
      );
      if (!rows[0]) throw new Error('CONFLICT');
      return rows[0];
    }

    const next = overtimeOwnerTransition(request.status, input.action);
    if (!next) throw new Error('INVALID_TRANSITION');
    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_overtime_requests"
       SET status = $2, version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid AND version = $3 RETURNING *`,
      input.overtimeId,
      next,
      input.expectedVersion,
    );
    if (!rows[0]) throw new Error('CONFLICT');
    return rows[0];
  });
}

export async function copyRosterWeek(actor: TimeActionActor, input: CopyRosterInput) {
  if (!actor.canManageWorkforce) throw new Error('FORBIDDEN');
  const sourceEnd = new Date(`${input.sourceStart}T00:00:00.000Z`);
  const targetEnd = new Date(`${input.targetStart}T00:00:00.000Z`);
  if (Number.isNaN(sourceEnd.valueOf()) || Number.isNaN(targetEnd.valueOf())) throw new Error('INVALID_DATE_RANGE');
  sourceEnd.setUTCDate(sourceEnd.getUTCDate() + 7);
  targetEnd.setUTCDate(targetEnd.getUTCDate() + 6);

  const rosterPolicy = await getTimePolicyConfig();
  return prisma.$transaction(async tx => {
    let periods = await tx.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "hr_roster_periods"
       WHERE $1::date BETWEEN start_date AND end_date
         AND ($2::uuid IS NULL OR company_id IS NULL OR company_id = $2::uuid)
         AND status NOT IN ('locked', 'archived')
       ORDER BY company_id NULLS LAST, start_date DESC LIMIT 1 FOR UPDATE`,
      input.targetStart,
      actor.companyId,
    );
    if (!periods[0]) {
      const id = randomUUID();
      periods = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO "hr_roster_periods"
          (id, name, company_id, start_date, end_date, status, created_at, updated_at)
         VALUES ($1::uuid, $2, $3::uuid, $4::date, $5::date, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        id,
        `Roster · ${input.targetStart}`,
        actor.companyId,
        input.targetStart,
        targetEnd.toISOString().slice(0, 10),
      );
    }
    const targetPeriodId = periods[0].id;
    const source = await tx.$queryRawUnsafe<Array<Record<string, unknown> & {
      id: string;
      employee_id: string;
      shift_date: Date;
      start_time: string;
      end_time: string;
    }>>(
      `SELECT * FROM "hr_shift_assignments"
       WHERE shift_date::date >= $1::date AND shift_date::date < $2::date
         AND status <> 'cancelled'
       ORDER BY shift_date, start_time`,
      input.sourceStart,
      sourceEnd.toISOString().slice(0, 10),
    );
    const inserted: Record<string, unknown>[] = [];
    for (const row of source) {
      const targetDate = rosterCopyTargetDate(new Date(row.shift_date).toISOString().slice(0, 10), input.sourceStart, input.targetStart);
      const conflicts = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "hr_shift_assignments"
         WHERE employee_id = $1::uuid AND shift_date::date = $2::date AND status <> 'cancelled' LIMIT 1`,
        row.employee_id,
        targetDate,
      );
      if (conflicts[0]) throw new Error('SHIFT_CONFLICT');
      const id = randomUUID();
      const offset = timezoneOffsetMinutesForDate(rosterPolicy.timezone, targetDate);
      const window = resolveShiftWindow(targetDate, row.start_time, row.end_time, offset);
      const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `INSERT INTO "hr_shift_assignments"
          (id, employee_id, roster_period_id, schedule_id, shift_definition_id, shift_definition_version,
           shift_date, logical_shift_date, start_time, end_time, start_at, end_at,
           work_location, status, publication_status, change_reason, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6,
                 $7::date, $7::date, $8, $9, $10, $11,
                 $12, 'scheduled', 'draft', $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        id,
        row.employee_id,
        targetPeriodId,
        row.schedule_id || null,
        row.shift_definition_id || null,
        row.shift_definition_version || null,
        targetDate,
        row.start_time,
        row.end_time,
        window.start,
        window.end,
        row.work_location || null,
        input.reason,
      );
      inserted.push(rows[0]);
    }
    return { assignments: inserted, employeeIds: [...new Set(inserted.map(row => String(row.employee_id)))] };
  });
}
