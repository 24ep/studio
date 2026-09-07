import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';

import { calculateAttendance, resolveShiftWindow } from './attendance-calculation';
import type { ShiftAttendanceMutation, ShiftView } from './shift-attendance-contracts';
import { getTimePolicyConfig, timezoneOffsetMinutesForDate } from './time-policy-config';
import { copyRosterWeek, mutateOwnedOvertime, mutateOwnedShiftRequest, validateOwnedShiftRequestTargets } from './time-owner-actions';
import { mutateTimeSetup } from './time-setup-actions';
import { listTimeOvertime, listTimeRequests } from './time-workspace-data';
import { hasAnyPermission, isAdminUser } from '@/lib/permissions';
import prisma from '@/lib/prisma';

type SessionUser = {
  id: string;
  email?: string | null;
  role?: string;
  modulePermissions?: string[];
};

type EmployeeActor = {
  id: string;
  user_id: string | null;
  manager_id: string | null;
  company_id: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
};

export type ShiftAttendanceActor = {
  user: SessionUser;
  employee: EmployeeActor | null;
  canViewWorkforce: boolean;
  canManageWorkforce: boolean;
  canViewPayroll: boolean;
  canManagePayroll: boolean;
  hasDirectReports: boolean;
  companyId: string | null;
};

function minutesBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

function mondayFor(value: Date) {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function humanId(prefix: string, id: string) {
  return `${prefix}-${id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

function isMissingRelationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('does not exist') || message.includes('Unknown argument');
}

export async function resolveShiftAttendanceActor(user: SessionUser): Promise<ShiftAttendanceActor> {
  const employeeRows = await prisma.$queryRawUnsafe<EmployeeActor[]>(
    `SELECT id, user_id, manager_id, company_id, first_name, last_name, preferred_name
     FROM "hr_employees"
     WHERE "user_id" = $1::uuid OR lower("email") = lower($2)
     ORDER BY CASE WHEN "user_id" = $1::uuid THEN 0 ELSE 1 END
     LIMIT 1`,
    user.id,
    user.email || '',
  );
  const employee = employeeRows[0] || null;
  const directReports = employee
    ? await prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count FROM "hr_employees" WHERE "manager_id" = $1::uuid AND "status" = 'active'`,
        employee.id,
      )
    : [];

  return {
    user,
    employee,
    canViewWorkforce: hasAnyPermission(user, ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE']),
    canManageWorkforce: hasAnyPermission(user, ['HR_WORKFORCE_MANAGE']),
    canViewPayroll: hasAnyPermission(user, ['HR_PAYROLL_VIEW', 'HR_PAYROLL_MANAGE']),
    canManagePayroll: hasAnyPermission(user, ['HR_PAYROLL_MANAGE']),
    hasDirectReports: Number(directReports[0]?.count || 0) > 0,
    companyId: isAdminUser(user) ? null : employee?.company_id || null,
  };
}

function requireEmployee(actor: ShiftAttendanceActor) {
  if (!actor.employee) throw new Error('NO_EMPLOYEE');
  return actor.employee;
}

function requireWorkforceView(actor: ShiftAttendanceActor) {
  if (!actor.canViewWorkforce && !actor.hasDirectReports) throw new Error('FORBIDDEN');
}

function requireWorkforceManage(actor: ShiftAttendanceActor) {
  if (!actor.canManageWorkforce) throw new Error('FORBIDDEN');
}

async function canAccessEmployee(
  actor: ShiftAttendanceActor,
  employeeId: string,
  allowSelf: boolean,
) {
  if (actor.canManageWorkforce) {
    if (!actor.companyId) return true;
    const companyRows = await prisma.$queryRawUnsafe<{ company_id: string | null }[]>(
      `SELECT company_id FROM "hr_employees" WHERE id = $1::uuid LIMIT 1`,
      employeeId,
    );
    return companyRows[0]?.company_id === actor.companyId;
  }
  if (allowSelf && actor.employee?.id === employeeId) return true;
  if (!actor.employee || !actor.hasDirectReports) return false;
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "hr_employees"
     WHERE id = $1::uuid AND manager_id = $2::uuid
       AND ($3::uuid IS NULL OR company_id = $3::uuid)
     LIMIT 1`,
    employeeId,
    actor.employee.id,
    actor.companyId,
  );
  return Boolean(rows[0]);
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

async function listRoster(actor: ShiftAttendanceActor, searchParams: URLSearchParams) {
  requireWorkforceView(actor);
  const start = searchParams.get('start') || dateKey(mondayFor(new Date()));
  const rangeDays = Math.min(35, Math.max(1, Number(searchParams.get('days') || 7)));
  const endDate = new Date(`${start}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + rangeDays);
  const end = dateKey(endDate);
  const scope = employeeScopeSql(actor);
  const employeeQuery = searchParams.get('employeeQuery')?.trim() || '';

  const [assignments, employees, periods, openShifts, shiftDefinitions] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT sa.*, e.employee_number, e.first_name, e.last_name, e.preferred_name,
              e.job_title, e.location AS employee_location, e.profile_photo_url,
              d.name AS department_name, ws.name AS schedule_name,
              EXISTS (
                SELECT 1 FROM "hr_leave_requests" lr
                WHERE lr.employee_id = e.id AND lr.status = 'approved'
                  AND sa.shift_date::date BETWEEN lr.start_date::date AND lr.end_date::date
              ) AS on_approved_leave,
              EXISTS (
                SELECT 1 FROM "hr_shift_assignments" overlap
                WHERE overlap.employee_id = sa.employee_id AND overlap.id <> sa.id
                  AND overlap.status <> 'cancelled'
                  AND COALESCE(overlap.start_at, (overlap.shift_date::date + overlap.start_time::time) AT TIME ZONE 'Asia/Bangkok')
                      < COALESCE(sa.end_at, (sa.shift_date::date + sa.end_time::time) AT TIME ZONE 'Asia/Bangkok')
                  AND COALESCE(overlap.end_at, (overlap.shift_date::date + overlap.end_time::time) AT TIME ZONE 'Asia/Bangkok')
                      > COALESCE(sa.start_at, (sa.shift_date::date + sa.start_time::time) AT TIME ZONE 'Asia/Bangkok')
              ) AS overlapping_shift
       FROM "hr_shift_assignments" sa
       JOIN "hr_employees" e ON e.id = sa.employee_id
       LEFT JOIN "hr_departments" d ON d.id = e.department_id
       LEFT JOIN "hr_work_schedules" ws ON ws.id = sa.schedule_id
       WHERE sa.shift_date::date >= $${scope.params.length + 1}::date
         AND sa.shift_date::date < $${scope.params.length + 2}::date
         AND sa.status <> 'cancelled' ${scope.clause}
       ORDER BY sa.shift_date, sa.start_time, e.first_name
       LIMIT 1000`,
      ...scope.params,
      start,
      end,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT e.id, e.employee_number, e.first_name, e.last_name, e.preferred_name,
              e.job_title, e.location AS employee_location, e.profile_photo_url, d.name AS department_name
       FROM "hr_employees" e
       LEFT JOIN "hr_departments" d ON d.id = e.department_id
       WHERE e.status = 'active'
         AND ( $${scope.params.length + 1} = '' OR (
           concat_ws(' ', e.first_name, e.last_name, e.preferred_name, e.employee_number, e.job_title, COALESCE(d.name, e.location, ''))
             ILIKE '%' || $${scope.params.length + 1} || '%'
         ))
         ${scope.clause}
       ORDER BY e.first_name, e.last_name
       LIMIT 500`,
      ...scope.params,
      employeeQuery,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "hr_roster_periods"
       WHERE start_date <= $2::date AND end_date >= $1::date
         AND ($3::uuid IS NULL OR company_id IS NULL OR company_id = $3::uuid)
       ORDER BY start_date DESC
       LIMIT 20`,
      start,
      end,
      actor.companyId,
    ).catch(error => {
      if (isMissingRelationError(error)) return [];
      throw error;
    }),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "hr_open_shifts"
       WHERE shift_date >= $1::date AND shift_date < $2::date AND status = 'open'
       ORDER BY shift_date, start_at`,
      start,
      end,
    ).catch(error => {
      if (isMissingRelationError(error)) return [];
      throw error;
    }),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT sd.*, sdv.start_time, sdv.end_time, sdv.overnight,
              sdv.grace_period_minutes, sdv.work_location
       FROM "hr_shift_definitions" sd
       JOIN "hr_shift_definition_versions" sdv
         ON sdv.shift_definition_id = sd.id AND sdv.version = sd.current_version
       WHERE sd.is_active = TRUE
       ORDER BY sd.name`,
    ).catch(error => {
      if (isMissingRelationError(error)) return [];
      throw error;
    }),
  ]);

  const conflictCount = assignments.filter(row => row.on_approved_leave || row.overlapping_shift).length;
  const scheduledMinutes = assignments.reduce((sum, row) => {
    const startAt = row.start_at ? new Date(String(row.start_at)) : null;
    const endAt = row.end_at ? new Date(String(row.end_at)) : null;
    return sum + (startAt && endAt ? minutesBetween(startAt, endAt) : 0);
  }, 0);

  return {
    view: 'roster',
    range: { start, end, days: rangeDays },
    metrics: {
      scheduledEmployees: new Set(assignments.map(row => row.employee_id)).size,
      assignments: assignments.length,
      openShifts: openShifts.length,
      conflicts: conflictCount,
      scheduledHours: Math.round(scheduledMinutes / 6) / 10,
      published: assignments.filter(row => row.publication_status === 'published').length,
    },
    assignments,
    employees,
    periods,
    openShifts,
    shiftDefinitions,
  };
}

async function listAttendance(actor: ShiftAttendanceActor, searchParams: URLSearchParams) {
  requireWorkforceView(actor);
  const date = searchParams.get('date') || dateKey(new Date());
  const status = searchParams.get('status');
  const query = searchParams.get('query')?.trim() || '';
  const department = searchParams.get('department')?.trim() || '';
  const location = searchParams.get('location')?.trim() || '';
  const exceptionType = searchParams.get('exceptionType')?.trim() || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get('pageSize') || 50)));
  const scope = employeeScopeSql(actor);

  const records = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT ar.*, e.employee_number, e.first_name, e.last_name, e.preferred_name,
            e.job_title, e.location AS employee_location, e.profile_photo_url,
            d.name AS department_name, sa.start_time, sa.end_time,
            ws.name AS shift_name,
            COALESCE(
              jsonb_agg(
                DISTINCT jsonb_build_object(
                  'id', ae.id, 'code', ae.code, 'severity', ae.severity,
                  'status', ae.status, 'explanation', ae.explanation
                )
              ) FILTER (WHERE ae.id IS NOT NULL),
              '[]'::jsonb
            ) AS exceptions,
            (
              SELECT er.status FROM "hr_ess_requests" er
              WHERE er.request_type = 'attendance_correction'
                AND er.requester_employee_id = ar.employee_id
                AND (er.requested_values->>'workDate')::date = ar.work_date::date
              ORDER BY er.created_at DESC LIMIT 1
            ) AS request_status
     FROM "hr_attendance_records" ar
     JOIN "hr_employees" e ON e.id = ar.employee_id
     LEFT JOIN "hr_departments" d ON d.id = e.department_id
     LEFT JOIN "hr_shift_assignments" sa ON sa.id = ar.assignment_id
     LEFT JOIN "hr_work_schedules" ws ON ws.id = sa.schedule_id
     LEFT JOIN "hr_attendance_exceptions" ae ON ae.attendance_record_id = ar.id
     WHERE ar.work_date::date = $${scope.params.length + 1}::date
       AND ($${scope.params.length + 2} = '' OR ar.status = $${scope.params.length + 2})
       AND (
         $${scope.params.length + 3} = ''
         OR concat_ws(' ', e.first_name, e.last_name, e.employee_number, d.name) ILIKE '%' || $${scope.params.length + 3} || '%'
       )
       AND ($${scope.params.length + 4} = '' OR COALESCE(d.name, '') = $${scope.params.length + 4})
       AND ($${scope.params.length + 5} = '' OR COALESCE(ar.work_location, e.location, '') = $${scope.params.length + 5})
       AND ($${scope.params.length + 6} = '' OR EXISTS (
         SELECT 1 FROM "hr_attendance_exceptions" aef
         WHERE aef.attendance_record_id = ar.id AND aef.code = $${scope.params.length + 6}
       ))
       ${scope.clause}
     GROUP BY ar.id, e.employee_number, e.first_name, e.last_name, e.preferred_name,
              e.job_title, e.location, e.profile_photo_url, d.name, sa.start_time,
              sa.end_time, ws.name
     ORDER BY
       CASE WHEN ar.exception_status <> 'clear' THEN 0 ELSE 1 END,
       e.first_name, e.last_name
     LIMIT $${scope.params.length + 7} OFFSET $${scope.params.length + 8}`,
    ...scope.params,
    date,
    status || '',
    query,
    department,
    location,
    exceptionType,
    pageSize,
    (page - 1) * pageSize,
  ).catch(error => {
    if (isMissingRelationError(error)) {
      return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT ar.*, e.employee_number, e.first_name, e.last_name, e.preferred_name,
                e.job_title, e.location AS employee_location, e.profile_photo_url,
                d.name AS department_name, '[]'::jsonb AS exceptions
         FROM "hr_attendance_records" ar
         JOIN "hr_employees" e ON e.id = ar.employee_id
         LEFT JOIN "hr_departments" d ON d.id = e.department_id
         WHERE ar.work_date::date = $${scope.params.length + 1}::date ${scope.clause}
         ORDER BY e.first_name, e.last_name
         LIMIT $${scope.params.length + 2} OFFSET $${scope.params.length + 3}`,
        ...scope.params,
        date,
        pageSize,
        (page - 1) * pageSize,
      );
    }
    throw error;
  });

  const [scheduledRows, leaveRows, periods, facetRows] = await Promise.all([
    prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(DISTINCT sa.employee_id)::int AS count
       FROM "hr_shift_assignments" sa
       JOIN "hr_employees" e ON e.id = sa.employee_id
       WHERE sa.shift_date::date = $${scope.params.length + 1}::date
         AND sa.status <> 'cancelled' ${scope.clause}`,
      ...scope.params,
      date,
    ),
    prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(DISTINCT lr.employee_id)::int AS count
       FROM "hr_leave_requests" lr
       JOIN "hr_employees" e ON e.id = lr.employee_id
       WHERE lr.status = 'approved'
         AND $${scope.params.length + 1}::date BETWEEN lr.start_date::date AND lr.end_date::date
         ${scope.clause}`,
      ...scope.params,
      date,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ap.*,
              (SELECT COUNT(*)::int
               FROM "hr_attendance_exceptions" ae
               JOIN "hr_attendance_records" ar ON ar.id = ae.attendance_record_id
               JOIN "hr_employees" e ON e.id = ar.employee_id
               WHERE ae.status = 'open' AND ar.work_date::date BETWEEN ap.start_date AND ap.end_date
                 AND (ap.company_id IS NULL OR e.company_id = ap.company_id)) AS open_exception_count
       FROM "hr_attendance_periods" ap
       WHERE $1::date BETWEEN ap.start_date AND ap.end_date
         AND ($2::uuid IS NULL OR ap.company_id IS NULL OR ap.company_id = $2::uuid)
       ORDER BY ap.start_date DESC LIMIT 5`,
      date,
      actor.companyId,
    ).catch(error => {
      if (isMissingRelationError(error)) return [];
      throw error;
    }),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT d.name ORDER BY d.name), NULL) AS departments,
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT COALESCE(ar.work_location, e.location) ORDER BY COALESCE(ar.work_location, e.location)), NULL) AS locations,
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT ae.code ORDER BY ae.code), NULL) AS exception_types
       FROM "hr_attendance_records" ar
       JOIN "hr_employees" e ON e.id = ar.employee_id
       LEFT JOIN "hr_departments" d ON d.id = e.department_id
       LEFT JOIN "hr_attendance_exceptions" ae ON ae.attendance_record_id = ar.id
       WHERE ar.work_date::date = $${scope.params.length + 1}::date ${scope.clause}`,
      ...scope.params,
      date,
    ).catch(() => []),
  ]);

  const statusCount = (target: string) => records.filter(row => row.status === target).length;
  const exceptions = records.filter(row => row.exception_status && row.exception_status !== 'clear').length
    || records.filter(row => Array.isArray(row.exceptions) && row.exceptions.length > 0).length;
  return {
    view: 'attendance',
    date,
    pagination: { page, pageSize, hasMore: records.length === pageSize },
    metrics: {
      scheduled: Number(scheduledRows[0]?.count || 0),
      present: statusCount('present') + statusCount('checked_out'),
      notCheckedIn: Math.max(0, Number(scheduledRows[0]?.count || 0) - records.length - Number(leaveRows[0]?.count || 0)),
      late: statusCount('late'),
      absent: statusCount('absent'),
      onLeave: Number(leaveRows[0]?.count || 0),
      remote: statusCount('working_remotely') + statusCount('remote'),
      onBreak: statusCount('on_break'),
      checkedOut: statusCount('checked_out'),
      missingCheckout: records.filter(row => row.clock_in && !row.clock_out).length,
      overtime: records.filter(row => Number(row.overtime_minutes || row.overtime_hours || 0) > 0).length,
      exceptions,
    },
    records,
    periods,
    facets: facetRows[0] || { departments: [], locations: [], exception_types: [] },
  };
}

async function listTimesheets(actor: ShiftAttendanceActor, searchParams: URLSearchParams) {
  const employee = actor.employee;
  if (!employee && !actor.canViewWorkforce) throw new Error('NO_EMPLOYEE');
  const reference = searchParams.get('week')
    ? new Date(`${searchParams.get('week')}T00:00:00.000Z`)
    : new Date();
  const start = dateKey(mondayFor(reference));
  const endDate = new Date(`${start}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const end = dateKey(endDate);
  const scope = searchParams.get('scope') === 'self' && employee
    ? { clause: 'AND e.id = $1::uuid', params: [employee.id] }
    : employeeScopeSql(actor);

  const timesheets = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT ts.id, ts.timesheet_number, e.id AS employee_id,
            COALESCE(ts.period_start, $${scope.params.length + 1}::date) AS period_start,
            COALESCE(ts.period_end, $${scope.params.length + 2}::date) AS period_end,
            COALESCE(ts.status, 'not_started') AS status,
            COALESCE(ts.total_minutes, 0)::int AS total_minutes,
            COALESCE(ts.billable_minutes, 0)::int AS billable_minutes,
            COALESCE(ts.attendance_minutes, 0)::int AS attendance_minutes,
            COALESCE(ts.difference_minutes, 0)::int AS difference_minutes,
            COALESCE(ts.version, 0)::int AS version,
            e.employee_number, e.first_name, e.last_name, e.preferred_name,
            e.job_title, e.profile_photo_url, d.name AS department_name,
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'id', te.id, 'workDate', te.work_date, 'project', te.project,
                  'task', te.task, 'client', te.client, 'costCenter', te.cost_center,
                  'workType', te.work_type, 'startAt', te.start_at, 'endAt', te.end_at,
                  'durationMinutes', te.duration_minutes, 'billable', te.billable,
                  'description', te.description, 'workLocation', te.work_location,
                  'status', te.status, 'version', te.version
                ) ORDER BY te.work_date, te.start_at NULLS LAST, te.created_at
              ) FILTER (WHERE te.id IS NOT NULL),
              '[]'::jsonb
            ) AS entries,
            COALESCE((
              SELECT jsonb_agg(
                jsonb_build_object(
                  'workDate', ar.work_date,
                  'workedMinutes', COALESCE(ar.worked_minutes, ar.hours_worked * 60, 0),
                  'status', ar.status,
                  'clockIn', ar.clock_in,
                  'clockOut', ar.clock_out
                ) ORDER BY ar.work_date
              )
              FROM "hr_attendance_records" ar
              WHERE ar.employee_id = e.id
                AND ar.work_date::date BETWEEN $${scope.params.length + 1}::date AND $${scope.params.length + 2}::date
            ), '[]'::jsonb) AS attendance
     FROM "hr_employees" e
     LEFT JOIN "hr_departments" d ON d.id = e.department_id
     LEFT JOIN "hr_timesheets" ts ON ts.employee_id = e.id
       AND ts.period_start = $${scope.params.length + 1}::date
       AND ts.period_end = $${scope.params.length + 2}::date
     LEFT JOIN "hr_timesheet_entries" te ON te.timesheet_id = ts.id
     WHERE e.status = 'active'
       ${scope.clause}
     GROUP BY ts.id, e.id, e.employee_number, e.first_name, e.last_name, e.preferred_name,
              e.job_title, e.profile_photo_url, d.name
     ORDER BY e.first_name, e.last_name`,
    ...scope.params,
    start,
    end,
  ).catch(error => {
    if (isMissingRelationError(error)) return [];
    throw error;
  });

  const attendance = employee
    ? await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT work_date, worked_minutes, hours_worked
         FROM "hr_attendance_records"
         WHERE employee_id = $1::uuid AND work_date::date BETWEEN $2::date AND $3::date
         ORDER BY work_date`,
        employee.id,
        start,
        end,
      )
    : [];

  const projects = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT DISTINCT te.project
     FROM "hr_timesheet_entries" te
     JOIN "hr_timesheets" ts ON ts.id = te.timesheet_id
     JOIN "hr_employees" e ON e.id = ts.employee_id
     WHERE te.project IS NOT NULL AND BTRIM(te.project) <> ''
       ${scope.clause}
     ORDER BY te.project`,
    ...scope.params,
  ).catch(error => {
    if (isMissingRelationError(error)) return [];
    throw error;
  });

  return {
    view: 'timesheet',
    range: { start, end },
    selfEmployeeId: employee?.id || null,
    metrics: {
      totalMinutes: timesheets.reduce((sum, row) => sum + Number(row.total_minutes || 0), 0),
      billableMinutes: timesheets.reduce((sum, row) => sum + Number(row.billable_minutes || 0), 0),
      differenceMinutes: timesheets.reduce((sum, row) => sum + Math.abs(Number(row.difference_minutes || 0)), 0),
      pending: timesheets.filter(row => ['submitted', 'pending_approval'].includes(String(row.status))).length,
    },
    timesheets,
    attendance,
    projects,
  };
}


async function listReports(actor: ShiftAttendanceActor, searchParams: URLSearchParams) {
  requireWorkforceView(actor);
  const end = searchParams.get('end') || dateKey(new Date());
  const startDate = new Date(`${end}T00:00:00.000Z`);
  startDate.setUTCDate(startDate.getUTCDate() - 29);
  const start = searchParams.get('start') || dateKey(startDate);
  const scope = employeeScopeSql(actor);
  const daily = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT ar.work_date::date AS date,
            COUNT(*)::int AS records,
            COUNT(*) FILTER (WHERE ar.status IN ('present', 'checked_out'))::int AS present,
            COUNT(*) FILTER (WHERE ar.status = 'late')::int AS late,
            COUNT(*) FILTER (WHERE ar.status = 'absent')::int AS absent,
            COUNT(*) FILTER (WHERE ar.exception_status <> 'clear')::int AS exceptions,
            COALESCE(SUM(ar.worked_minutes), SUM(ar.hours_worked * 60), 0)::int AS worked_minutes,
            COALESCE(SUM(ar.overtime_minutes), SUM(ar.overtime_hours * 60), 0)::int AS overtime_minutes
     FROM "hr_attendance_records" ar
     JOIN "hr_employees" e ON e.id = ar.employee_id
     WHERE ar.work_date::date BETWEEN $${scope.params.length + 1}::date AND $${scope.params.length + 2}::date
       ${scope.clause}
     GROUP BY ar.work_date::date
     ORDER BY ar.work_date::date`,
    ...scope.params,
    start,
    end,
  );
  return { view: 'reports', range: { start, end }, daily };
}

export async function getShiftAttendanceData(
  actor: ShiftAttendanceActor,
  view: ShiftView,
  searchParams: URLSearchParams,
) {
  if (view === 'roster') return listRoster(actor, searchParams);
  if (view === 'attendance') return listAttendance(actor, searchParams);
  if (view === 'requests') return listTimeRequests(actor, searchParams);
  if (view === 'overtime') return listTimeOvertime(actor, searchParams);
  if (view === 'timesheet') return listTimesheets(actor, searchParams);
  return listReports(actor, searchParams);
}
async function createAssignment(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'create_assignment' }>,
) {
  requireWorkforceManage(actor);
  const policy = await getTimePolicyConfig();
  const offset = timezoneOffsetMinutesForDate(policy.timezone, input.shiftDate);
  const { start, end } = resolveShiftWindow(input.shiftDate, input.startTime, input.endTime, offset);
  const restMs = policy.minimumShiftRestHours * 60 * 60_000;
  const restStart = new Date(start.getTime() - restMs);
  const restEnd = new Date(end.getTime() + restMs);
  for (const employeeId of input.employeeIds) {
    if (!await canAccessEmployee(actor, employeeId, false)) throw new Error('FORBIDDEN');
  }
  return prisma.$transaction(async tx => {
    const rosterPeriods = await tx.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "hr_roster_periods"
       WHERE $1::date BETWEEN start_date AND end_date
         AND ($2::uuid IS NULL OR company_id IS NULL OR company_id = $2::uuid)
         AND status NOT IN ('locked', 'archived')
       ORDER BY company_id NULLS LAST, start_date DESC LIMIT 1
       FOR UPDATE`,
      input.shiftDate,
      actor.companyId,
    );
    const rosterPeriodId = rosterPeriods[0]?.id;
    if (!rosterPeriodId) throw new Error('NOT_FOUND');

    if (input.openShiftId) {
      const openShifts = await tx.$queryRawUnsafe<Array<{
        headcount_assigned: number;
        headcount_required: number;
      }>>(
        `SELECT headcount_assigned, headcount_required FROM "hr_open_shifts"
         WHERE id = $1::uuid AND shift_date = $2::date AND status = 'open'
         FOR UPDATE`,
        input.openShiftId,
        input.shiftDate,
      );
      const openShift = openShifts[0];
      if (!openShift) throw new Error('NOT_FOUND');
      if (Number(openShift.headcount_assigned || 0) + input.employeeIds.length > Number(openShift.headcount_required)) {
        throw new Error('SHIFT_CONFLICT');
      }
    }

    const rows: Record<string, unknown>[] = [];
    for (const employeeId of input.employeeIds) {
      const conflicts = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "hr_shift_assignments"
         WHERE employee_id = $1::uuid AND status <> 'cancelled'
           AND COALESCE(start_at, (shift_date::date + start_time::time) AT TIME ZONE 'Asia/Bangkok') < $3
           AND COALESCE(end_at,
             CASE WHEN end_time::time <= start_time::time
               THEN ((shift_date::date + INTERVAL '1 day') + end_time::time) AT TIME ZONE 'Asia/Bangkok'
               ELSE (shift_date::date + end_time::time) AT TIME ZONE 'Asia/Bangkok' END
           ) > $2
         LIMIT 1
         FOR UPDATE`,
        employeeId,
        restStart,
        restEnd,
      );
      if (conflicts[0]) throw new Error('SHIFT_CONFLICT');
      const id = randomUUID();
      const inserted = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `INSERT INTO "hr_shift_assignments"
          (id, employee_id, roster_period_id, schedule_id, shift_definition_id, shift_definition_version,
           shift_date, logical_shift_date, start_time, end_time, start_at, end_at,
           work_location, status, publication_status, change_reason, created_at, updated_at)
         VALUES
          ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid,
           (SELECT current_version FROM "hr_shift_definitions" WHERE id = $5::uuid),
           $6::date, $6::date, $7, $8, $9, $10, $11, 'scheduled', 'draft', $12,
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        id,
        employeeId,
        rosterPeriodId,
        input.scheduleId || null,
        input.shiftDefinitionId || null,
        input.shiftDate,
        input.startTime,
        input.endTime,
        start,
        end,
        input.workLocation,
        input.reason || null,
      );
      if (!inserted[0]) throw new Error('CONFLICT');
      rows.push(inserted[0]);
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_shift_assignment_history"
         (id, assignment_id, version, previous_values, new_values, reason, actor_user_id, created_at)
         VALUES (gen_random_uuid(), $1::uuid, 1, '{}'::jsonb, $2::jsonb, $3, $4::uuid, CURRENT_TIMESTAMP)`,
        id, JSON.stringify(inserted[0]), input.reason, actor.user.id,
      );
    }
    if (input.openShiftId) {
      const updated = await tx.$executeRawUnsafe(
        `UPDATE "hr_open_shifts"
         SET headcount_assigned = COALESCE(headcount_assigned, 0) + $2,
             status = CASE WHEN COALESCE(headcount_assigned, 0) + $2 = headcount_required THEN 'filled' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid AND shift_date = $3::date AND status = 'open'`,
        input.openShiftId,
        input.employeeIds.length,
        input.shiftDate,
      );
      if (updated !== 1) throw new Error('CONFLICT');
    }
    return rows;
  });
}


async function publishRoster(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'publish_roster' }>,
) {
  requireWorkforceManage(actor);
  return prisma.$transaction(async tx => {
    const periods = await tx.$queryRawUnsafe<Array<{ id: string; status: string; version: number; company_id: string | null }>>(
      `SELECT * FROM "hr_roster_periods" WHERE id = $1::uuid FOR UPDATE`,
      input.rosterPeriodId,
    );
    const period = periods[0];
    if (!period) throw new Error('NOT_FOUND');
    if (actor.companyId && period.company_id && actor.companyId !== period.company_id) throw new Error('FORBIDDEN');
    if (['locked', 'archived'].includes(period.status)) throw new Error('PERIOD_LOCKED');
    await tx.$executeRawUnsafe(
      `INSERT INTO "hr_shift_assignment_history"
        (id, assignment_id, version, previous_values, new_values, reason, actor_user_id, created_at)
       SELECT gen_random_uuid(), sa.id, sa.version,
              jsonb_build_object('publicationStatus', sa.publication_status, 'publishedAt', sa.published_at),
              jsonb_build_object('publicationStatus', 'published', 'publishedAt', CURRENT_TIMESTAMP),
              $2, $3::uuid, CURRENT_TIMESTAMP
       FROM "hr_shift_assignments" sa
       WHERE sa.roster_period_id = $1::uuid`,
      input.rosterPeriodId,
      input.reason,
      actor.user.id,
    );
    const assignments = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_shift_assignments"
       SET publication_status = 'published', published_at = CURRENT_TIMESTAMP,
           published_by_id = $2::uuid, change_reason = $3,
           version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE roster_period_id = $1::uuid AND status <> 'cancelled'
       RETURNING *`,
      input.rosterPeriodId,
      actor.user.id,
      input.reason,
    );
    const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_roster_periods"
       SET status = 'published', published_at = CURRENT_TIMESTAMP,
           published_by_id = $2::uuid, version = version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid RETURNING *`,
      input.rosterPeriodId,
      actor.user.id,
    );
    return { period: updated[0], assignments, employeeIds: [...new Set(assignments.map(row => String(row.employee_id)).filter(Boolean))] };
  });
}
async function changeAssignment(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'update_assignment' | 'delete_assignment' }>,
) {
  requireWorkforceManage(actor);
  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Array<Record<string, unknown> & { employee_id: string; version: number; status: string }>>(
      `SELECT * FROM "hr_shift_assignments" WHERE id = $1::uuid FOR UPDATE`,
      input.assignmentId,
    );
    const assignment = rows[0];
    if (!assignment) throw new Error('NOT_FOUND');
    if (!await canAccessEmployee(actor, assignment.employee_id, false)) throw new Error('FORBIDDEN');
    if (assignment.version !== input.expectedVersion) throw new Error('CONFLICT');
    if (assignment.status === 'cancelled') throw new Error('INVALID_TRANSITION');

    if (input.action === 'delete_assignment') {
      const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_shift_assignments"
         SET status = 'cancelled', publication_status = 'changed', change_reason = $2,
             version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid AND version = $3 RETURNING *`,
        input.assignmentId, input.reason, input.expectedVersion,
      );
      if (!updated[0]) throw new Error('CONFLICT');
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_shift_assignment_history" (id, assignment_id, version, previous_values, new_values, reason, actor_user_id, created_at)
         VALUES (gen_random_uuid(), $1::uuid, $2, $3::jsonb, $4::jsonb, $5, $6::uuid, CURRENT_TIMESTAMP)`,
        input.assignmentId, input.expectedVersion, JSON.stringify(assignment), JSON.stringify(updated[0]), input.reason, actor.user.id,
      );
      return updated[0];
    }

    const policy = await getTimePolicyConfig();
    const offset = timezoneOffsetMinutesForDate(policy.timezone, input.shiftDate);
    const { start, end } = resolveShiftWindow(input.shiftDate, input.startTime, input.endTime, offset);
    const restMs = policy.minimumShiftRestHours * 60 * 60_000;
    const restStart = new Date(start.getTime() - restMs);
    const restEnd = new Date(end.getTime() + restMs);
    const conflicts = await tx.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "hr_shift_assignments"
       WHERE employee_id = $1::uuid AND id <> $2::uuid AND status <> 'cancelled'
         AND COALESCE(start_at, (shift_date::date + start_time::time) AT TIME ZONE 'Asia/Bangkok') < $4
         AND COALESCE(end_at, CASE WHEN end_time::time <= start_time::time
           THEN ((shift_date::date + INTERVAL '1 day') + end_time::time) AT TIME ZONE 'Asia/Bangkok'
           ELSE (shift_date::date + end_time::time) AT TIME ZONE 'Asia/Bangkok' END) > $3
       LIMIT 1`,
      assignment.employee_id, input.assignmentId, restStart, restEnd,
    );
    if (conflicts[0]) throw new Error('SHIFT_CONFLICT');
    const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_shift_assignments"
       SET shift_definition_id = $2::uuid,
           shift_definition_version = (SELECT current_version FROM "hr_shift_definitions" WHERE id = $2::uuid),
           shift_date = $3::date, logical_shift_date = $3::date, start_time = $4, end_time = $5,
           start_at = $6, end_at = $7, work_location = $8, change_reason = $9,
           publication_status = CASE WHEN publication_status = 'published' THEN 'changed' ELSE publication_status END,
           version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid AND version = $10 RETURNING *`,
      input.assignmentId, input.shiftDefinitionId || null, input.shiftDate, input.startTime,
      input.endTime, start, end, input.workLocation, input.reason, input.expectedVersion,
    );
    if (!updated[0]) throw new Error('CONFLICT');
    await tx.$executeRawUnsafe(
      `INSERT INTO "hr_shift_assignment_history" (id, assignment_id, version, previous_values, new_values, reason, actor_user_id, created_at)
       VALUES (gen_random_uuid(), $1::uuid, $2, $3::jsonb, $4::jsonb, $5, $6::uuid, CURRENT_TIMESTAMP)`,
      input.assignmentId, input.expectedVersion, JSON.stringify(assignment), JSON.stringify(updated[0]), input.reason, actor.user.id,
    );
    return updated[0];
  });
}
async function recalculateRecord(actor: ShiftAttendanceActor, attendanceRecordId: string) {
  requireWorkforceManage(actor);
  const policy = await getTimePolicyConfig();
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT ar.*, sa.start_at, sa.end_at, sa.start_time, sa.end_time, sa.shift_date,
            sdv.grace_period_minutes AS grace_period_minutes,
            COALESCE(sdv.early_departure_tolerance_minutes, 5) AS early_departure_tolerance_minutes,
            EXISTS (
              SELECT 1 FROM "hr_leave_requests" lr
              WHERE lr.employee_id = ar.employee_id AND lr.status = 'approved'
                AND ar.work_date::date BETWEEN lr.start_date::date AND lr.end_date::date
            ) AS approved_leave,
            EXISTS (
              SELECT 1 FROM "hr_holidays" h
              WHERE h.holiday_date::date = ar.work_date::date
                AND (h.location IS NULL OR h.location = ar.work_location)
            ) AS public_holiday,
            COALESCE((
              SELECT SUM(COALESCE(ot.approved_minutes, 0))
              FROM "hr_overtime_requests" ot
              WHERE ot.employee_id = ar.employee_id AND ot.work_date = ar.work_date::date
                AND ot.status IN ('approved', 'confirmed', 'payroll_ready')
            ), 0)::int AS approved_overtime_minutes
     FROM "hr_attendance_records" ar
     LEFT JOIN "hr_shift_assignments" sa
       ON sa.id = ar.assignment_id
       OR (sa.employee_id = ar.employee_id AND sa.shift_date::date = ar.work_date::date AND sa.status <> 'cancelled')
     LEFT JOIN "hr_shift_definition_versions" sdv
       ON sdv.shift_definition_id = sa.shift_definition_id
       AND sdv.version = sa.shift_definition_version
     WHERE ar.id = $1::uuid
     ORDER BY sa.publication_status = 'published' DESC
     LIMIT 1`,
    attendanceRecordId,
  );
  const row = rows[0];
  if (!row) throw new Error('NOT_FOUND');
  if (!await canAccessEmployee(actor, String(row.employee_id), false)) throw new Error('FORBIDDEN');
  let scheduledStart = row.scheduled_start_at ? new Date(String(row.scheduled_start_at)) : null;
  let scheduledEnd = row.scheduled_end_at ? new Date(String(row.scheduled_end_at)) : null;
  if ((!scheduledStart || !scheduledEnd) && row.shift_date && row.start_time && row.end_time) {
    const window = resolveShiftWindow(
      new Date(String(row.shift_date)).toISOString().slice(0, 10),
      String(row.start_time),
      String(row.end_time),
    );
    scheduledStart = window.start;
    scheduledEnd = window.end;
  }
  const input = {
    logicalDate: new Date(String(row.work_date)).toISOString().slice(0, 10),
    scheduledStart,
    scheduledEnd,
    clockIn: row.clock_in ? new Date(String(row.clock_in)) : null,
    clockOut: row.clock_out ? new Date(String(row.clock_out)) : null,
    breakMinutes: Number(row.break_minutes || 0),
    approvedLeave: Boolean(row.approved_leave),
    publicHoliday: Boolean(row.public_holiday),
    lateToleranceMinutes: Number(row.grace_period_minutes ?? policy.lateGraceMinutes),
    earlyDepartureToleranceMinutes: Number(row.early_departure_tolerance_minutes || 5),
    roundingMinutes: 1,
    approvedOvertimeMinutes: Number(row.approved_overtime_minutes || 0),
    workLocation: row.work_location ? String(row.work_location) : null,
    openBreakStartedAt: row.open_break_started_at ? new Date(String(row.open_break_started_at)) : null,
  };
  const output = calculateAttendance(input);
  return prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe(
      `UPDATE "hr_attendance_calculations"
       SET is_current = FALSE
       WHERE attendance_record_id = $1::uuid AND is_current = TRUE`,
      attendanceRecordId,
    );
    await tx.$executeRawUnsafe(
      `INSERT INTO "hr_attendance_calculations"
        (id, attendance_record_id, calculation_version, input_snapshot, output_snapshot,
         explanation, is_current, calculated_by_id, calculated_at)
       VALUES ($1::uuid, $2::uuid, $3, $4::jsonb, $5::jsonb, $6::jsonb, TRUE, $7::uuid, CURRENT_TIMESTAMP)`,
      randomUUID(),
      attendanceRecordId,
      output.calculationVersion,
      JSON.stringify(input),
      JSON.stringify(output),
      JSON.stringify(output.reasons),
      actor.user.id,
    );
    await tx.$executeRawUnsafe(
      `DELETE FROM "hr_attendance_exceptions"
       WHERE attendance_record_id = $1::uuid AND status = 'open'`,
      attendanceRecordId,
    );
    for (const code of output.exceptionCodes) {
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_attendance_exceptions"
          (id, attendance_record_id, code, severity, status, explanation, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3, $4, 'open', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        randomUUID(),
        attendanceRecordId,
        code,
        code === 'MISSING_CHECK_IN' ? 'blocked' : 'warning',
        output.reasons.find(reason => reason.toUpperCase().includes(code.split('_')[0])) || output.reasons.join(' '),
      );
    }
    const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_attendance_records"
       SET status = $2, scheduled_start_at = $3, scheduled_end_at = $4,
           scheduled_minutes = $5, worked_minutes = $6, regular_minutes = $7,
           overtime_minutes = $8, hours_worked = $6::numeric / 60,
           overtime_hours = $8::numeric / 60, late_minutes = $9,
           early_departure_minutes = $10,
           exception_status = CASE WHEN $11::int > 0 THEN 'open' ELSE 'clear' END,
           calculation_version = $12, version = version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid RETURNING *`,
      attendanceRecordId,
      output.status,
      scheduledStart,
      scheduledEnd,
      output.scheduledMinutes,
      output.workedMinutes,
      output.regularMinutes,
      output.overtimeMinutes,
      output.lateMinutes,
      output.earlyDepartureMinutes,
      output.exceptionCodes.length,
      output.calculationVersion,
    );
    return { record: updated[0], calculation: output };
  });
}


async function reviewAttendance(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'review_attendance' }>,
) {
  requireWorkforceManage(actor);
  const status = {
    mark_for_review: 'under_review',
    hold: 'on_hold',
    close: 'closed',
  }[input.decision];
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE "hr_attendance_records"
     SET review_status = $2,
         closed_at = CASE WHEN $2 = 'closed' THEN CURRENT_TIMESTAMP ELSE closed_at END,
         closed_by_id = CASE WHEN $2 = 'closed' THEN $3::uuid ELSE closed_by_id END,
         attendance_note = concat_ws(E'\n', NULLIF(attendance_note, ''), $4),
         version = version + 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1::uuid AND version = $5
     RETURNING *`,
    input.attendanceRecordId,
    status,
    actor.user.id,
    input.reason,
    input.expectedVersion,
  );
  if (!rows[0]) throw new Error('CONFLICT');
  return rows[0];
}

async function transitionAttendancePeriod(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'close_period' | 'reopen_period' | 'export_payroll' }>,
) {
  requireWorkforceManage(actor);
  if (input.action === 'export_payroll' && !actor.canManagePayroll) throw new Error('PAYROLL_FORBIDDEN');
  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Array<Record<string, unknown> & {
      status: string;
      start_date: Date;
      end_date: Date;
      company_id: string | null;
      version: number;
    }>>(
      `SELECT * FROM "hr_attendance_periods" WHERE id = $1::uuid FOR UPDATE`,
      input.attendancePeriodId,
    );
    const period = rows[0];
    if (!period) throw new Error('NOT_FOUND');
    if (period.version !== input.expectedVersion) throw new Error('CONFLICT');
    if (actor.companyId && period.company_id && actor.companyId !== period.company_id) throw new Error('FORBIDDEN');

    if (input.action === 'close_period') {
      const openExceptions = await tx.$queryRawUnsafe<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count
         FROM "hr_attendance_exceptions" ae
         JOIN "hr_attendance_records" ar ON ar.id = ae.attendance_record_id
         WHERE ae.status = 'open' AND ar.work_date::date BETWEEN $1::date AND $2::date`,
        period.start_date,
        period.end_date,
      );
      if (Number(openExceptions[0]?.count || 0) > 0) throw new Error('EXCEPTIONS_PENDING');
      const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_attendance_periods"
         SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closed_by_id = $2::uuid,
             version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid RETURNING *`,
        input.attendancePeriodId,
        actor.user.id,
      );
      await tx.$executeRawUnsafe(
        `UPDATE "hr_attendance_records"
         SET review_status = 'closed', closed_at = CURRENT_TIMESTAMP,
             closed_by_id = $1::uuid, version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE work_date::date BETWEEN $2::date AND $3::date
           AND ($4::uuid IS NULL OR employee_id IN (
             SELECT id FROM "hr_employees" WHERE company_id = $4::uuid
           ))`,
        actor.user.id,
        period.start_date,
        period.end_date,
        period.company_id,
      );
      return updated[0];
    }

    if (input.action === 'reopen_period') {
      if (!['closed', 'exported_to_payroll'].includes(period.status)) throw new Error('INVALID_TRANSITION');
      const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_attendance_periods"
         SET status = 'reopened', reopened_at = CURRENT_TIMESTAMP,
             reopened_by_id = $2::uuid, reopen_reason = $3,
             version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid RETURNING *`,
        input.attendancePeriodId,
        actor.user.id,
        input.reason,
      );
      return updated[0];
    }

    if (period.status !== 'closed') throw new Error('PERIOD_NOT_CLOSED');
    const records = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ar.id, ar.employee_id, ar.work_date, ar.regular_minutes, ar.overtime_minutes,
              ar.status, ar.calculation_version
       FROM "hr_attendance_records" ar
       JOIN "hr_employees" e ON e.id = ar.employee_id
       WHERE ar.work_date::date BETWEEN $1::date AND $2::date
         AND ar.review_status = 'closed'
         AND ($3::uuid IS NULL OR e.company_id = $3::uuid)
       ORDER BY ar.work_date, ar.employee_id`,
      period.start_date,
      period.end_date,
      period.company_id,
    );
    const exportId = randomUUID();
    const regularMinutes = records.reduce((sum, row) => sum + Number(row.regular_minutes || 0), 0);
    const overtimeMinutes = records.reduce((sum, row) => sum + Number(row.overtime_minutes || 0), 0);
    const exports = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO "hr_payroll_attendance_exports"
        (id, attendance_period_id, export_number, record_count, regular_minutes,
         overtime_minutes, payload, status, exported_by_id, exported_at, created_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::jsonb, 'ready',
               $8::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      exportId,
      input.attendancePeriodId,
      humanId('PAYATT', exportId),
      records.length,
      regularMinutes,
      overtimeMinutes,
      JSON.stringify(records),
      actor.user.id,
    );
    await tx.$executeRawUnsafe(
      `UPDATE "hr_attendance_periods"
       SET status = 'exported_to_payroll', exported_at = CURRENT_TIMESTAMP,
           exported_by_id = $2::uuid, version = version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid`,
      input.attendancePeriodId,
      actor.user.id,
    );
    return exports[0];
  });
}
async function createShiftRequest(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'create_shift_request' }>,
) {
  const employee = requireEmployee(actor);
  const warnings: string[] = [];
  if (input.effectiveEnd < input.effectiveStart) throw new Error('INVALID_DATE_RANGE');
  await validateOwnedShiftRequestTargets(employee.id, input);
  if (input.assignmentId) {
    const assignments = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "hr_shift_assignments" WHERE id = $1::uuid AND employee_id = $2::uuid LIMIT 1`,
      input.assignmentId,
      employee.id,
    );
    if (!assignments[0]) throw new Error('FORBIDDEN');
    if (assignments[0].publication_status === 'locked') warnings.push('The roster period is locked and requires roster-planner approval.');
  }
  const id = randomUUID();
  const status = input.saveAsDraft
    ? 'draft'
    : input.requestType === 'shift_swap'
      ? 'awaiting_employee'
      : 'pending_approval';
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `INSERT INTO "hr_shift_requests"
      (id, request_id, employee_id, request_type, assignment_id, requested_assignment_id,
       open_shift_id, swap_employee_id, effective_start, effective_end, work_location, reason,
       policy_warnings, status, created_at, updated_at)
     VALUES ($1::uuid, $2, $3::uuid, $4, $5::uuid, $6::uuid, $7::uuid, $8::uuid,
             $9::date, $10::date, $11, $12, $13::jsonb, $14,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    id,
    humanId('SHR', id),
    employee.id,
    input.requestType,
    input.assignmentId || null,
    input.requestedAssignmentId || null,
    input.openShiftId || null,
    input.swapEmployeeId || null,
    input.effectiveStart,
    input.effectiveEnd,
    input.workLocation || null,
    input.reason,
    JSON.stringify(warnings),
    status,
  );
  return rows[0];
}
async function decideShiftRequest(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'decide_shift_request' }>,
) {
  const requests = await prisma.$queryRawUnsafe<Array<Record<string, unknown> & {
    employee_id: string;
    swap_employee_id: string | null;
    assignment_id: string | null;
    requested_assignment_id: string | null;
    open_shift_id: string | null;
    request_type: string;
    effective_start: Date;
    effective_end: Date;
    work_location: string | null;
    status: string;
    version: number;
  }>>(
    `SELECT * FROM "hr_shift_requests" WHERE id = $1::uuid LIMIT 1`,
    input.requestId,
  );
  const request = requests[0];
  if (!request) throw new Error('NOT_FOUND');
  if (request.version !== input.expectedVersion) throw new Error('CONFLICT');
  if (input.decision === 'accept_swap') {
    const employee = requireEmployee(actor);
    if (request.swap_employee_id !== employee.id || request.status !== 'awaiting_employee') throw new Error('FORBIDDEN');
    const updated = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_shift_requests"
       SET status = 'pending_approval', colleague_accepted_at = CURRENT_TIMESTAMP,
           version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid AND version = $2 RETURNING *`,
      input.requestId,
      input.expectedVersion,
    );
    if (!updated[0]) throw new Error('CONFLICT');
    return updated[0];
  }

  if (!await canAccessEmployee(actor, request.employee_id, false)) throw new Error('FORBIDDEN');
  if (['reject', 'return_for_revision'].includes(input.decision) && !input.comment?.trim()) throw new Error('COMMENT_REQUIRED');
  if (request.status !== 'pending_approval') throw new Error('INVALID_TRANSITION');
  if (input.decision === 'approve') {
    return prisma.$transaction(async tx => {
      if (request.request_type === 'shift_swap' && request.assignment_id && request.requested_assignment_id && request.swap_employee_id) {
        const assignments = await tx.$queryRawUnsafe<Array<{ id: string; employee_id: string; version: number }>>(
          `SELECT id, employee_id, version FROM "hr_shift_assignments"
           WHERE id IN ($1::uuid, $2::uuid) FOR UPDATE`,
          request.assignment_id,
          request.requested_assignment_id,
        );
        const own = assignments.find(row => row.id === request.assignment_id);
        const other = assignments.find(row => row.id === request.requested_assignment_id);
        if (!own || !other || own.employee_id !== request.employee_id || other.employee_id !== request.swap_employee_id) {
          throw new Error('SHIFT_CONFLICT');
        }
        await tx.$executeRawUnsafe(
          `UPDATE "hr_shift_assignments"
           SET employee_id = CASE WHEN id = $1::uuid THEN $3::uuid ELSE $4::uuid END,
               publication_status = 'changed', change_reason = $5,
               version = version + 1, updated_at = CURRENT_TIMESTAMP
           WHERE id IN ($1::uuid, $2::uuid)`,
          request.assignment_id,
          request.requested_assignment_id,
          request.swap_employee_id,
          request.employee_id,
          input.comment || 'Approved shift swap',
        );
      }
      if (request.request_type === 'open_shift') {
        if (!request.open_shift_id) throw new Error('NOT_FOUND');
        const openRows = await tx.$queryRawUnsafe<Array<{ id: string; roster_period_id: string | null; shift_definition_id: string | null; shift_date: Date; start_at: Date; end_at: Date; work_location: string | null; headcount_required: number; headcount_assigned: number }>>(
          `SELECT * FROM "hr_open_shifts" WHERE id = $1::uuid AND status = 'open' FOR UPDATE`, request.open_shift_id);
        const open = openRows[0];
        if (!open || Number(open.headcount_assigned || 0) >= Number(open.headcount_required || 0)) throw new Error('SHIFT_CONFLICT');
        const policy = await getTimePolicyConfig();
        const restMs = policy.minimumShiftRestHours * 60 * 60_000;
        const conflicts = await tx.$queryRawUnsafe<{ id: string }[]>(
          `SELECT id FROM "hr_shift_assignments" WHERE employee_id = $1::uuid AND status <> 'cancelled'
             AND COALESCE(end_at, start_at) > $2 AND COALESCE(start_at, end_at) < $3 LIMIT 1`,
          request.employee_id, new Date(open.start_at.getTime() - restMs), new Date(open.end_at.getTime() + restMs));
        if (conflicts[0]) throw new Error('SHIFT_CONFLICT');
        await tx.$executeRawUnsafe(
          `INSERT INTO "hr_shift_assignments"
            (id, employee_id, roster_period_id, shift_definition_id, shift_definition_version,
             shift_date, logical_shift_date, start_time, end_time, start_at, end_at, work_location,
             status, publication_status, change_reason, created_at, updated_at)
           SELECT gen_random_uuid(), $2::uuid, os.roster_period_id, os.shift_definition_id, sd.current_version,
                  os.shift_date, os.shift_date,
                  to_char(os.start_at AT TIME ZONE $3, 'HH24:MI'), to_char(os.end_at AT TIME ZONE $3, 'HH24:MI'),
                  os.start_at, os.end_at, os.work_location, 'scheduled', 'changed', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
           FROM "hr_open_shifts" os LEFT JOIN "hr_shift_definitions" sd ON sd.id = os.shift_definition_id
           WHERE os.id = $1::uuid`, request.open_shift_id, request.employee_id, policy.timezone, input.comment || 'Approved open-shift request');
        await tx.$executeRawUnsafe(
          `UPDATE "hr_open_shifts" SET headcount_assigned = headcount_assigned + 1,
             status = CASE WHEN headcount_assigned + 1 >= headcount_required THEN 'filled' ELSE 'open' END,
             updated_at = CURRENT_TIMESTAMP WHERE id = $1::uuid`, request.open_shift_id);
      } else if (request.request_type !== 'shift_swap') {
        const targetId = request.assignment_id || request.requested_assignment_id;
        if (request.request_type !== 'availability_update' && !targetId) throw new Error('NOT_FOUND');
        if (request.request_type === 'drop_shift') {
          await tx.$executeRawUnsafe(
            `UPDATE "hr_shift_assignments" SET status = 'cancelled', publication_status = 'changed',
                    change_reason = $2, version = version + 1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1::uuid AND employee_id = $3::uuid`,
            targetId, input.comment || 'Approved drop-shift request', request.employee_id,
          );
        } else if (request.request_type === 'cover_shift') {
          await tx.$executeRawUnsafe(
            `UPDATE "hr_shift_assignments" SET employee_id = $2::uuid, publication_status = 'changed',
                    change_reason = $3, version = version + 1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1::uuid`,
            targetId, request.employee_id, input.comment || 'Approved shift coverage request',
          );
        } else if (request.request_type === 'work_location_change') {
          if (!request.work_location) throw new Error('INVALID_TRANSITION');
          await tx.$executeRawUnsafe(
            `UPDATE "hr_shift_assignments" SET work_location = $2, publication_status = 'changed',
                    change_reason = $3, version = version + 1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1::uuid AND employee_id = $4::uuid`,
            targetId, request.work_location, input.comment || 'Approved work-location change', request.employee_id,
          );
        } else if (['shift_change', 'temporary_schedule_change', 'rest_day_change'].includes(request.request_type)) {
          await tx.$executeRawUnsafe(
            `UPDATE "hr_shift_assignments"
             SET shift_date = $2::date, logical_shift_date = $2::date,
                 start_at = ($2::date + start_time::time) AT TIME ZONE 'Asia/Bangkok',
                 end_at = CASE WHEN end_time::time <= start_time::time
                   THEN (($2::date + INTERVAL '1 day') + end_time::time) AT TIME ZONE 'Asia/Bangkok'
                   ELSE ($2::date + end_time::time) AT TIME ZONE 'Asia/Bangkok' END,
                 work_location = COALESCE($3, work_location), publication_status = 'changed',
                 change_reason = $4, version = version + 1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1::uuid AND employee_id = $5::uuid`,
            targetId, request.effective_start, request.work_location,
            input.comment || 'Approved schedule change', request.employee_id,
          );
        } else if (request.request_type === 'availability_update') {
          await tx.$executeRawUnsafe(
            `INSERT INTO "hr_employee_availability"
              (id, employee_id, available_from, available_to, availability_type, work_location, notes, created_at, updated_at)
             VALUES (gen_random_uuid(), $1::uuid, $2::date, ($3::date + INTERVAL '1 day'),
                     'available', $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            request.employee_id, request.effective_start, request.effective_end,
            request.work_location, input.comment || 'Approved availability update',
          );
        }
      }
      const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_shift_requests"
         SET status = 'applied', approved_by_id = $2::uuid,
             approved_at = CURRENT_TIMESTAMP, applied_at = CURRENT_TIMESTAMP,
             version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid AND version = $3 RETURNING *`,
        input.requestId,
        actor.user.id,
        input.expectedVersion,
      );
      if (!updated[0]) throw new Error('CONFLICT');
      return updated[0];
    });
  }
  const nextStatus = input.decision === 'reject' ? 'rejected' : 'returned_for_revision';
  const updated = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE "hr_shift_requests"
     SET status = $2, version = version + 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1::uuid AND version = $3 RETURNING *`,
    input.requestId,
    nextStatus,
    input.expectedVersion,
  );
  if (!updated[0]) throw new Error('CONFLICT');
  return updated[0];
}
async function createOvertime(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'create_overtime' }>,
) {
  const employee = requireEmployee(actor);
  const policy = await getTimePolicyConfig();
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  const rawMinutes = Math.max(0, minutesBetween(startAt, endAt) - input.breakMinutes);
  const requestedMinutes = Math.max(0, Math.round(rawMinutes / policy.overtimeRoundingMinutes) * policy.overtimeRoundingMinutes);
  const warnings: string[] = [];
  if (requestedMinutes < 30) warnings.push('Overtime below 30 minutes may be ineligible under company policy.');
  if (requestedMinutes > 240) warnings.push('Overtime above four hours requires HR review.');
  const overlaps = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "hr_overtime_requests"
     WHERE employee_id = $1::uuid AND status NOT IN ('rejected', 'withdrawn', 'cancelled')
       AND requested_start_at < $3 AND requested_end_at > $2
     LIMIT 1`,
    employee.id,
    startAt,
    endAt,
  ).catch(error => {
    if (isMissingRelationError(error)) return [];
    throw error;
  });
  if (overlaps[0]) throw new Error('OVERTIME_CONFLICT');
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `INSERT INTO "hr_overtime_requests"
      (id, request_id, employee_id, assignment_id, work_date, overtime_type,
       requested_start_at, requested_end_at, requested_minutes, break_minutes,
       business_reason, project, cost_center, work_location, compensation_method,
       policy_warnings, status, created_at, updated_at)
     VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5::date, $6, $7, $8, $9, $10,
             $11, $12, $13, $14, $15, $16::jsonb, $17,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    id,
    humanId('OT', id),
    employee.id,
    input.assignmentId || null,
    input.date,
    input.overtimeType,
    startAt,
    endAt,
    requestedMinutes,
    input.breakMinutes,
    input.reason,
    input.project || null,
    input.costCenter || null,
    input.workLocation || null,
    input.compensationMethod,
    JSON.stringify(warnings),
    input.saveAsDraft ? 'draft' : policy.overtimeApprovalRequired ? 'pending_approval' : 'approved',
  );
  if (rows[0] && !input.saveAsDraft && !policy.overtimeApprovalRequired) {
    const approved = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_overtime_requests" SET approved_start_at = requested_start_at, approved_end_at = requested_end_at,
         approved_minutes = requested_minutes, approved_at = CURRENT_TIMESTAMP, version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid RETURNING *`, id);
    return approved[0];
  }
  return rows[0];
}
async function decideOvertime(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'decide_overtime' }>,
) {
  const policy = await getTimePolicyConfig();
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown> & {
    employee_id: string;
    status: string;
    version: number;
    requested_start_at: Date;
    requested_end_at: Date;
    requested_minutes: number;
    break_minutes: number;
    work_date: Date;
  }>>(
    `SELECT * FROM "hr_overtime_requests" WHERE id = $1::uuid LIMIT 1`,
    input.overtimeId,
  );
  const request = rows[0];
  if (!request) throw new Error('NOT_FOUND');
  if (request.version !== input.expectedVersion) throw new Error('CONFLICT');
  if (!await canAccessEmployee(actor, request.employee_id, false)) throw new Error('FORBIDDEN');
  if (['reject', 'return_for_revision'].includes(input.decision) && !input.comment?.trim()) {
    throw new Error('COMMENT_REQUIRED');
  }

  return prisma.$transaction(async tx => {
    const lockedRows = await tx.$queryRawUnsafe<typeof rows>(
      `SELECT * FROM "hr_overtime_requests" WHERE id = $1::uuid FOR UPDATE`,
      input.overtimeId,
    );
    const locked = lockedRows[0];
    if (!locked) throw new Error('NOT_FOUND');
    if (locked.version !== input.expectedVersion) throw new Error('CONFLICT');

    if (input.decision === 'approve') {
      if (locked.status !== 'pending_approval') throw new Error('INVALID_TRANSITION');
      const start = input.approvedStartAt ? new Date(input.approvedStartAt) : new Date(locked.requested_start_at);
      const end = input.approvedEndAt ? new Date(input.approvedEndAt) : new Date(locked.requested_end_at);
      if (end <= start) throw new Error('INVALID_TRANSITION');
      const rawApprovedMinutes = Math.max(0, minutesBetween(start, end) - Number(locked.break_minutes || 0));
      const approvedMinutes = Math.max(0, Math.round(rawApprovedMinutes / policy.overtimeRoundingMinutes) * policy.overtimeRoundingMinutes);
      const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_overtime_requests"
         SET status = 'approved', approved_start_at = $2, approved_end_at = $3,
             approved_minutes = $4, approved_by_id = $5::uuid,
             approved_at = CURRENT_TIMESTAMP, difference_reason = $6,
             version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid AND version = $7 AND status = 'pending_approval' RETURNING *`,
        input.overtimeId, start, end, approvedMinutes, actor.user.id,
        input.comment || null, input.expectedVersion,
      );
      if (!updated[0]) throw new Error('CONFLICT');
      return updated[0];
    }

    if (input.decision === 'reject' || input.decision === 'return_for_revision') {
      const nextStatus = input.decision === 'reject' ? 'rejected' : 'returned_for_revision';
      const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_overtime_requests"
         SET status = $2, difference_reason = $3,
             version = version + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid AND version = $4 AND status = 'pending_approval'
         RETURNING *`,
        input.overtimeId, nextStatus, input.comment, input.expectedVersion,
      );
      if (!updated[0]) throw new Error('CONFLICT');
      return updated[0];
    }

    if (locked.status !== 'approved') throw new Error('INVALID_TRANSITION');
    const confirmedMinutes = input.confirmedMinutes ?? locked.requested_minutes;
    const updated = await tx.$queryRawUnsafe<Array<Record<string, unknown> & { eligible_minutes: number }>>(
      `UPDATE "hr_overtime_requests"
       SET status = 'confirmed', manager_confirmed_minutes = $2,
           eligible_minutes = LEAST(COALESCE(approved_minutes, requested_minutes), $2),
           difference_reason = $3, version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid AND version = $4 AND status = 'approved' RETURNING *`,
      input.overtimeId, confirmedMinutes, input.comment || null, input.expectedVersion,
    );
    if (!updated[0]) throw new Error('CONFLICT');
    const attendance = await tx.$queryRawUnsafe<{ id: string }[]>(
      `UPDATE "hr_attendance_records"
       SET overtime_minutes = $3,
           overtime_hours = $3::numeric / 60,
           version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $1::uuid AND work_date::date = $2::date
       RETURNING id`,
      locked.employee_id,
      locked.work_date,
      Number(updated[0].eligible_minutes),
    );
    if (!attendance[0]) throw new Error('NOT_FOUND');
    return updated[0];
  });
}


async function refreshTimesheetTotals(client: Prisma.TransactionClient, timesheetId: string) {
  await client.$executeRawUnsafe(
    `UPDATE "hr_timesheets" ts
     SET total_minutes = COALESCE((
           SELECT SUM(te.duration_minutes)::int FROM "hr_timesheet_entries" te
           WHERE te.timesheet_id = ts.id
         ), 0),
         billable_minutes = COALESCE((
           SELECT SUM(te.duration_minutes) FILTER (WHERE te.billable)::int
           FROM "hr_timesheet_entries" te WHERE te.timesheet_id = ts.id
         ), 0),
         attendance_minutes = COALESCE((
           SELECT SUM(COALESCE(ar.worked_minutes, ar.hours_worked * 60, 0))::int
           FROM "hr_attendance_records" ar
           WHERE ar.employee_id = ts.employee_id
             AND ar.work_date::date BETWEEN ts.period_start AND ts.period_end
         ), 0),
         difference_minutes = COALESCE((
           SELECT SUM(te.duration_minutes)::int FROM "hr_timesheet_entries" te
           WHERE te.timesheet_id = ts.id
         ), 0) - COALESCE((
           SELECT SUM(COALESCE(ar.worked_minutes, ar.hours_worked * 60, 0))::int
           FROM "hr_attendance_records" ar
           WHERE ar.employee_id = ts.employee_id
             AND ar.work_date::date BETWEEN ts.period_start AND ts.period_end
         ), 0),
         version = version + 1, updated_at = CURRENT_TIMESTAMP
     WHERE ts.id = $1::uuid`,
    timesheetId,
  );
}

async function saveTimesheetEntry(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'save_timesheet_entry' }>,
) {
  const employee = requireEmployee(actor);
  const workDate = new Date(`${input.workDate}T00:00:00.000Z`);
  const weekStart = mondayFor(workDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  return prisma.$transaction(async tx => {
    let timesheetId = input.timesheetId || null;
    if (!timesheetId) {
      const id = randomUUID();
      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO "hr_timesheets"
          (id, timesheet_number, employee_id, period_start, period_end, status,
           created_at, updated_at)
         VALUES ($1::uuid, $2, $3::uuid, $4::date, $5::date, 'draft',
                 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (employee_id, period_start, period_end)
         DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        id,
        humanId('TS', id),
        employee.id,
        dateKey(weekStart),
        dateKey(weekEnd),
      );
      timesheetId = rows[0].id;
    }
    const sheets = await tx.$queryRawUnsafe<Array<{ employee_id: string; status: string }>>(
      `SELECT employee_id, status FROM "hr_timesheets" WHERE id = $1::uuid FOR UPDATE`,
      timesheetId,
    );
    if (!sheets[0] || sheets[0].employee_id !== employee.id) throw new Error('FORBIDDEN');
    if (sheets[0].status !== 'draft' && sheets[0].status !== 'returned') throw new Error('PERIOD_LOCKED');

    if (input.startAt && input.endAt) {
      const overlaps = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "hr_timesheet_entries"
         WHERE timesheet_id = $1::uuid AND work_date = $2::date
           AND id <> COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
           AND start_at IS NOT NULL AND end_at IS NOT NULL
           AND start_at < $5::timestamptz AND end_at > $4::timestamptz
         LIMIT 1`,
        timesheetId,
        input.workDate,
        input.entryId || null,
        input.startAt,
        input.endAt,
      );
      if (overlaps[0]) throw new Error('TIMESHEET_OVERLAP');
    }
    const entryId = input.entryId || randomUUID();
    const entries = input.entryId
      ? await tx.$queryRawUnsafe<Record<string, unknown>[]>(
          `UPDATE "hr_timesheet_entries"
           SET work_date = $3::date, project = $4, task = $5, client = $6,
               cost_center = $7, work_type = $8, start_at = $9, end_at = $10,
               duration_minutes = $11, billable = $12, description = $13,
               work_location = $14, version = version + 1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1::uuid AND timesheet_id = $2::uuid
           RETURNING *`,
          entryId,
          timesheetId,
          input.workDate,
          input.project,
          input.task || null,
          input.client || null,
          input.costCenter || null,
          input.workType || null,
          input.startAt ? new Date(input.startAt) : null,
          input.endAt ? new Date(input.endAt) : null,
          input.durationMinutes,
          input.billable,
          input.description,
          input.workLocation || null,
        )
      : await tx.$queryRawUnsafe<Record<string, unknown>[]>(
          `INSERT INTO "hr_timesheet_entries"
            (id, timesheet_id, work_date, project, task, client, cost_center, work_type,
             start_at, end_at, duration_minutes, billable, description, work_location,
             status, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, $3::date, $4, $5, $6, $7, $8, $9, $10,
                   $11, $12, $13, $14, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          entryId,
          timesheetId,
          input.workDate,
          input.project,
          input.task || null,
          input.client || null,
          input.costCenter || null,
          input.workType || null,
          input.startAt ? new Date(input.startAt) : null,
          input.endAt ? new Date(input.endAt) : null,
          input.durationMinutes,
          input.billable,
          input.description,
          input.workLocation || null,
        );
    await refreshTimesheetTotals(tx, timesheetId);
    return { timesheetId, entry: entries[0] };
  });
}

async function deleteTimesheetEntry(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'delete_timesheet_entry' }>,
) {
  const employee = requireEmployee(actor);
  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Array<{ timesheet_id: string }>>(
      `DELETE FROM "hr_timesheet_entries" te
       USING "hr_timesheets" ts
       WHERE te.id = $1::uuid AND te.version = $2
         AND ts.id = te.timesheet_id AND ts.employee_id = $3::uuid
         AND ts.status IN ('draft', 'returned')
       RETURNING te.timesheet_id`,
      input.entryId,
      input.expectedVersion,
      employee.id,
    );
    if (!rows[0]) throw new Error('CONFLICT');
    await refreshTimesheetTotals(tx, rows[0].timesheet_id);
    return { id: input.entryId };
  });
}

async function submitTimesheet(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'submit_timesheet' }>,
) {
  const employee = requireEmployee(actor);
  const overlaps = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*)::int AS count
     FROM "hr_timesheet_entries" a
     JOIN "hr_timesheet_entries" b
       ON a.timesheet_id = b.timesheet_id AND a.id < b.id
       AND a.work_date = b.work_date AND a.start_at < b.end_at AND a.end_at > b.start_at
     WHERE a.timesheet_id = $1::uuid`,
    input.timesheetId,
  );
  if (Number(overlaps[0]?.count || 0) > 0) throw new Error('TIMESHEET_OVERLAP');
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE "hr_timesheets"
     SET status = 'pending_approval', submitted_at = CURRENT_TIMESTAMP,
         version = version + 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1::uuid AND employee_id = $2::uuid
       AND version = $3 AND status IN ('draft', 'returned')
       AND total_minutes > 0
     RETURNING *`,
    input.timesheetId,
    employee.id,
    input.expectedVersion,
  );
  if (!rows[0]) throw new Error('CONFLICT');
  return rows[0];
}

async function decideTimesheet(
  actor: ShiftAttendanceActor,
  input: Extract<ShiftAttendanceMutation, { action: 'decide_timesheet' }>,
) {
  const sheets = await prisma.$queryRawUnsafe<Array<{ employee_id: string; status: string; version: number }>>(
    `SELECT employee_id, status, version FROM "hr_timesheets" WHERE id = $1::uuid LIMIT 1`,
    input.timesheetId,
  );
  const sheet = sheets[0];
  if (!sheet) throw new Error('NOT_FOUND');
  if (sheet.version !== input.expectedVersion) throw new Error('CONFLICT');
  if (!await canAccessEmployee(actor, sheet.employee_id, false)) throw new Error('FORBIDDEN');
  if (sheet.status !== 'pending_approval') throw new Error('INVALID_TRANSITION');
  const next = input.decision === 'approve' ? 'approved' : input.decision === 'reject' ? 'rejected' : 'returned';
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE "hr_timesheets"
     SET status = $2,
         approved_at = CASE WHEN $2 = 'approved' THEN CURRENT_TIMESTAMP ELSE NULL END,
         approved_by_id = CASE WHEN $2 = 'approved' THEN $3::uuid ELSE NULL END,
         version = version + 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1::uuid AND version = $4 RETURNING *`,
    input.timesheetId,
    next,
    actor.user.id,
    input.expectedVersion,
  );
  if (!rows[0]) throw new Error('CONFLICT');
  return rows[0];
}
export async function mutateShiftAttendance(
  actor: ShiftAttendanceActor,
  input: ShiftAttendanceMutation,
) {
  if (input.action === 'create_assignment') return createAssignment(actor, input);
  if (input.action === 'update_assignment' || input.action === 'delete_assignment') return changeAssignment(actor, input);
  if (input.action === 'publish_roster') return publishRoster(actor, input);
  if (input.action === 'copy_roster') return copyRosterWeek(actor, input);
  if (['create_roster_period','create_shift_definition','create_work_schedule','create_open_shift'].includes(input.action)) return mutateTimeSetup(actor, input as never);
  if (input.action === 'recalculate_attendance') return recalculateRecord(actor, input.attendanceRecordId);
  if (input.action === 'review_attendance') return reviewAttendance(actor, input);
  if (input.action === 'close_period' || input.action === 'reopen_period' || input.action === 'export_payroll') {
    return transitionAttendancePeriod(actor, input);
  }
  if (input.action === 'create_shift_request') return createShiftRequest(actor, input);
  if (input.action === 'decide_shift_request') return decideShiftRequest(actor, input);
  if (['update_shift_request','submit_shift_request','withdraw_shift_request','cancel_shift_request','resubmit_shift_request'].includes(input.action)) return mutateOwnedShiftRequest(actor, input as never);
  if (input.action === 'create_overtime') return createOvertime(actor, input);
  if (input.action === 'decide_overtime') return decideOvertime(actor, input);
  if (['update_overtime','submit_overtime','withdraw_overtime','cancel_overtime','resubmit_overtime'].includes(input.action)) return mutateOwnedOvertime(actor, input as never);
  if (input.action === 'save_timesheet_entry') return saveTimesheetEntry(actor, input);
  if (input.action === 'delete_timesheet_entry') return deleteTimesheetEntry(actor, input);
  if (input.action === 'submit_timesheet') return submitTimesheet(actor, input);
  if (input.action === 'decide_timesheet') return decideTimesheet(actor, input);
  throw new Error('INVALID_TRANSITION');
}

