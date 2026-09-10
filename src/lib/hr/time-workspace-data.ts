import prisma from '@/lib/prisma';

import type { ShiftAttendanceActor } from './shift-attendance-service';
import { getTimePolicyConfig } from './time-policy-config';

function isMissingRelationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('does not exist') || message.includes('Unknown argument');
}

function employeeScopeSql(actor: ShiftAttendanceActor, alias = 'e') {
  if (!actor.employee || actor.canViewWorkforce) {
    return {
      clause: actor.companyId ? `AND ${alias}."company_id" = $1::uuid` : '',
      params: actor.companyId ? [actor.companyId] : [],
    };
  }
  return {
    clause: `AND (${alias}."id" = $1::uuid OR ${alias}."manager_id" = $1::uuid)`,
    params: [actor.employee.id],
  };
}

export async function listTimeRequests(actor: ShiftAttendanceActor, searchParams: URLSearchParams) {
  const employee = actor.employee;
  if (!employee && !actor.canViewWorkforce) throw new Error('NO_EMPLOYEE');
  const scope = searchParams.get('scope') === 'self' && employee
    ? { clause: 'AND e.id = $1::uuid', params: [employee.id] }
    : employeeScopeSql(actor, 'e');
  const [shiftRequests, attendanceRequests, assignments, colleagues, eligibleSwapAssignments, openShifts] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT sr.*, e.employee_number, e.first_name, e.last_name, e.preferred_name,
              swap.first_name AS swap_first_name, swap.last_name AS swap_last_name
       FROM "hr_shift_requests" sr
       JOIN "hr_employees" e ON e.id = sr.employee_id
       LEFT JOIN "hr_employees" swap ON swap.id = sr.swap_employee_id
       WHERE 1=1 ${scope.clause}
       ORDER BY sr.created_at DESC LIMIT 100`,
      ...scope.params,
    ).catch(error => {
      if (isMissingRelationError(error)) return [];
      throw error;
    }),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT er.*, e.employee_number, e.first_name, e.last_name, e.preferred_name,
              e.job_title, e.profile_photo_url, d.name AS department_name
       FROM "hr_ess_requests" er
       JOIN "hr_employees" e ON e.id = er.requester_employee_id
       LEFT JOIN "hr_departments" d ON d.id = e.department_id
       WHERE er.request_type = 'attendance_correction' ${scope.clause}
       ORDER BY er.created_at DESC LIMIT 100`,
      ...scope.params,
    ),
    employee
      ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT sa.*, ws.name AS schedule_name
           FROM "hr_shift_assignments" sa
           LEFT JOIN "hr_work_schedules" ws ON ws.id = sa.schedule_id
           WHERE sa.employee_id = $1::uuid AND sa.shift_date::date >= CURRENT_DATE - INTERVAL '30 days'
           ORDER BY sa.shift_date DESC LIMIT 100`,
          employee.id,
        )
      : Promise.resolve([]),
    employee
      ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT id, employee_number, first_name, last_name, preferred_name, job_title
           FROM "hr_employees"
           WHERE id <> $1::uuid AND status = 'active'
             AND ($2::uuid IS NULL OR company_id = $2::uuid)
           ORDER BY first_name, last_name LIMIT 200`,
          employee.id,
          actor.companyId,
        )
      : Promise.resolve([]),
    employee
      ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT sa.*, e.employee_number, e.first_name, e.last_name, e.preferred_name, e.job_title,
                  ws.name AS schedule_name
           FROM "hr_shift_assignments" sa
           JOIN "hr_employees" e ON e.id = sa.employee_id
           LEFT JOIN "hr_work_schedules" ws ON ws.id = sa.schedule_id
           WHERE sa.employee_id <> $1::uuid AND e.status = 'active' AND sa.status <> 'cancelled'
             AND sa.shift_date::date >= CURRENT_DATE - INTERVAL '7 days'
             AND sa.shift_date::date <= CURRENT_DATE + INTERVAL '60 days'
             AND ($2::uuid IS NULL OR e.company_id = $2::uuid)
           ORDER BY sa.shift_date, sa.start_time LIMIT 500`,
          employee.id,
          actor.companyId,
        )
      : Promise.resolve([]),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT os.* FROM "hr_open_shifts" os
       LEFT JOIN "hr_roster_periods" rp ON rp.id = os.roster_period_id
       WHERE os.status = 'open' AND COALESCE(os.headcount_assigned, 0) < os.headcount_required
         AND os.shift_date >= CURRENT_DATE - INTERVAL '7 days'
         AND os.shift_date <= CURRENT_DATE + INTERVAL '60 days'
         AND ($1::uuid IS NULL OR rp.company_id IS NULL OR rp.company_id = $1::uuid)
       ORDER BY os.shift_date, os.start_at LIMIT 200`,
      actor.companyId,
    ).catch(error => {
      if (isMissingRelationError(error)) return [];
      throw error;
    }),
  ]);
  return { view: 'requests', shiftRequests, attendanceRequests, assignments, colleagues, eligibleSwapAssignments, openShifts };
}

export async function listTimeOvertime(actor: ShiftAttendanceActor, searchParams: URLSearchParams) {
  const employee = actor.employee;
  if (!employee && !actor.canViewWorkforce) throw new Error('NO_EMPLOYEE');
  const scope = searchParams.get('scope') === 'self' && employee
    ? { clause: 'AND e.id = $1::uuid', params: [employee.id] }
    : employeeScopeSql(actor);
  const policy = await getTimePolicyConfig();
  const [requests, assignments] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ot.*, e.employee_number, e.first_name, e.last_name, e.preferred_name,
              e.job_title, d.name AS department_name,
              ar.clock_in AS actual_clock_in, ar.clock_out AS actual_clock_out,
              (SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(sa.end_at,
                 CASE WHEN sa.end_time::time <= sa.start_time::time
                   THEN ((sa.shift_date::date + INTERVAL '1 day') + sa.end_time::time) AT TIME ZONE 'Asia/Bangkok'
                   ELSE (sa.shift_date::date + sa.end_time::time) AT TIME ZONE 'Asia/Bangkok' END) -
                 COALESCE(sa.start_at, (sa.shift_date::date + sa.start_time::time) AT TIME ZONE 'Asia/Bangkok'))) / 60), 0)::int
               FROM "hr_shift_assignments" sa
               WHERE sa.employee_id = ot.employee_id AND sa.status <> 'cancelled'
                 AND date_trunc('week', sa.shift_date::date) = date_trunc('week', ot.work_date::date)) AS scheduled_minutes,
              0 AS weekly_limit_minutes
       FROM "hr_overtime_requests" ot
       JOIN "hr_employees" e ON e.id = ot.employee_id
       LEFT JOIN "hr_departments" d ON d.id = e.department_id
       LEFT JOIN "hr_attendance_records" ar
         ON ar.employee_id = ot.employee_id AND ar.work_date::date = ot.work_date
       WHERE 1=1 ${scope.clause}
       ORDER BY ot.work_date DESC, ot.created_at DESC LIMIT 200`,
      ...scope.params,
    ).catch(error => {
      if (isMissingRelationError(error)) return [];
      throw error;
    }),
    employee
      ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT id, shift_date, start_time, end_time, work_location
           FROM "hr_shift_assignments"
           WHERE employee_id = $1::uuid AND shift_date::date >= CURRENT_DATE - INTERVAL '14 days'
           ORDER BY shift_date DESC LIMIT 50`,
          employee.id,
        )
      : Promise.resolve([]),
  ]);
  return {
    view: 'overtime',
    metrics: {
      pending: requests.filter(row => row.status === 'pending_approval').length,
      approvedMinutes: requests.reduce((sum, row) => sum + Number(row.approved_minutes || 0), 0),
      actualMinutes: requests.reduce((sum, row) => sum + Number(row.manager_confirmed_minutes || row.eligible_minutes || 0), 0),
      payrollReady: requests.filter(row => row.status === 'confirmed').length,
    },
    requests: requests.map(row => ({ ...row, weekly_limit_minutes: Math.round(policy.standardWeeklyHours * 60) })),
    assignments,
  };
}
