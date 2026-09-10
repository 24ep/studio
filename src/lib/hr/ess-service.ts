import { randomUUID } from 'crypto';
import { z } from 'zod';

import { sanitizeFilename } from '@/lib/fileUtils';
import { MINIO_BUCKET, minioClient } from '@/lib/minio';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';
import { maskSensitiveValue } from './ess-contracts';
import { getAttendanceGeofences, validateAttendanceGeofence } from './attendance-geofence';

export const essLeaveRequestSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().max(1000).optional().nullable(),
  policyId: z.string().uuid().optional().nullable(),
  requestUnit: z.enum(['full_day', 'half_day', 'hourly']).default('full_day'),
  halfDayPeriod: z.enum(['morning', 'afternoon']).optional().nullable(),
  requestedHours: z.coerce.number().positive().max(24).optional().nullable(),
  emergencyContact: z.string().min(1).max(500),
  handoverInformation: z.string().max(2000).optional().nullable(),
  actingEmployeeId: z.string().uuid().optional().nullable(),
  saveAsDraft: z.boolean().default(false),
});

export const essLeaveSegmentSchema = essLeaveRequestSchema.pick({
  startDate: true,
  endDate: true,
  policyId: true,
  requestUnit: true,
  halfDayPeriod: true,
  requestedHours: true,
});

export const essGroupedLeaveRequestSchema = essLeaveRequestSchema.partial({
  startDate: true, endDate: true, policyId: true, requestUnit: true,
}).extend({
  segments: z.array(essLeaveSegmentSchema).min(1).max(20).optional(),
}).superRefine((value, context) => {
  if (!value.segments?.length && (!value.startDate || !value.endDate)) {
    context.addIssue({ code: 'custom', message: 'Add at least one leave type and date range.', path: ['segments'] });
  }
});

export const essProfileRequestSchema = z.object({
  field: z.enum(['preferredName', 'phone', 'location']),
  requestedValue: z.string().min(1).max(255),
  reason: z.string().max(1000).optional().nullable(),
});

export const essLeavePatchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['cancel', 'withdraw', 'resubmit', 'submit']),
  expectedVersion: z.coerce.number().int().positive().optional(),
});

export const essLearningPatchSchema = z.object({
  id: z.string().uuid(),
  progress: z.coerce.number().min(0).max(100).optional(),
  action: z.enum(['start', 'complete']).optional(),
});

export const essOnboardingPatchSchema = z.object({
  onboardingId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  action: z.enum(['start', 'complete_task', 'complete_case']),
});

export const essTeamActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approve_leave', 'reject_leave', 'return_leave']),
  comment: z.string().max(2000).optional().nullable(),
  expectedVersion: z.coerce.number().int().positive().optional(),
}).refine(
  value => value.action === 'approve_leave' || Boolean(value.comment?.trim()),
  { message: 'A comment is required when rejecting or returning a request.', path: ['comment'] },
);

export const essAttendanceActionSchema = z.object({
  action: z.enum(['clock_in', 'clock_out', 'start_break', 'end_break']),
  workLocation: z.enum(['office', 'remote', 'field']).optional(),
  note: z.string().max(1000).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  locationAccuracyMeters: z.coerce.number().min(0).max(100_000).optional().nullable(),
  idempotencyKey: z.string().min(8).max(160).optional(),
  deviceId: z.string().max(160).optional().nullable(),
});

export type EssLeaveRequestInput = z.infer<typeof essLeaveRequestSchema>;
export type EssGroupedLeaveRequestInput = z.infer<typeof essGroupedLeaveRequestSchema>;
export type EssProfileRequestInput = z.infer<typeof essProfileRequestSchema>;

interface EmployeeRow {
  id: string;
  user_id: string | null;
  employee_number: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  phone: string | null;
  job_title: string | null;
  employment_type: string;
  status: string;
  hire_date: Date | null;
  location: string | null;
  manager_id?: string | null;
  department_id?: string | null;
  company_id?: string | null;
  legal_name?: string | null;
  business_unit?: string | null;
  work_phone?: string | null;
  profile_photo_url?: string | null;
  personal_information?: unknown;
  address?: unknown;
  emergency_contacts?: unknown;
  family_dependents?: unknown;
  bank_information?: unknown;
  tax_information?: unknown;
  government_identification?: unknown;
  education?: unknown;
  work_experience?: unknown;
  skills?: unknown;
  certifications?: unknown;
  languages?: unknown;
  profile_completion?: number;
  version?: number;
  department_name?: string | null;
  manager_name?: string | null;
}

export function calculateInclusiveLeaveDays(startDate: Date, endDate: Date) {
  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  return Math.max(1, Math.floor((end - start) / 86_400_000) + 1);
}

export function calculateWorkingLeaveDays({
  startDate,
  endDate,
  excludeWeekends,
  holidayDates = [],
}: {
  startDate: Date;
  endDate: Date;
  excludeWeekends: boolean;
  holidayDates?: string[];
}) {
  const holidays = new Set(holidayDates);
  let total = 0;
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const last = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  while (cursor <= last) {
    const dateKey = cursor.toISOString().slice(0, 10);
    const weekend = cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6;
    if ((!excludeWeekends || !weekend) && !holidays.has(dateKey)) total += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return total;
}

export function calculateAttendanceHours(clockIn: Date, clockOut: Date) {
  const hours = (clockOut.getTime() - clockIn.getTime()) / 3_600_000;
  return Math.max(0, Math.round(hours * 100) / 100);
}

export function getLocalDayBounds(value = new Date()) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function toIsoDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function employeeName(employee: Pick<EmployeeRow, 'preferred_name' | 'first_name' | 'last_name'>) {
  return [employee.preferred_name || employee.first_name, employee.last_name].filter(Boolean).join(' ');
}

function mapEmployee(employee: EmployeeRow) {
  return {
    id: employee.id,
    userId: employee.user_id,
    employeeNumber: employee.employee_number,
    name: employeeName(employee),
    email: employee.email,
    phone: employee.phone,
    jobTitle: employee.job_title,
    employmentType: employee.employment_type,
    status: employee.status,
    hireDate: toIsoDate(employee.hire_date),
    location: employee.location,
    managerId: employee.manager_id || null,
    legalName: employee.legal_name || `${employee.first_name} ${employee.last_name}`.trim(),
    preferredName: employee.preferred_name,
    firstName: employee.first_name,
    lastName: employee.last_name,
    companyId: employee.company_id || null,
    departmentId: employee.department_id || null,
    department: employee.department_name || null,
    businessUnit: employee.business_unit || null,
    managerName: employee.manager_name || null,
    workPhone: employee.work_phone || employee.phone,
    profilePhotoUrl: employee.profile_photo_url || null,
    profileCompletion: Number(employee.profile_completion || 35),
    version: Number(employee.version || 1),
    profile: {
      personalInformation: employee.personal_information || {},
      address: employee.address || {},
      emergencyContacts: employee.emergency_contacts || [],
      familyDependents: employee.family_dependents || [],
      education: employee.education || [],
      workExperience: employee.work_experience || [],
      skills: employee.skills || [],
      certifications: employee.certifications || [],
      languages: employee.languages || [],
    },
    sensitive: {
      bankInformation: maskSensitiveObject(employee.bank_information),
      taxInformation: maskSensitiveObject(employee.tax_information),
      governmentIdentification: maskSensitiveObject(employee.government_identification),
    },
    fieldPermissions: {
      preferredName: 'employee_editable_with_approval',
      phone: 'employee_editable_with_approval',
      address: 'employee_editable_with_approval',
      emergencyContacts: 'employee_editable_with_approval',
      familyDependents: 'employee_editable_with_approval',
      bankInformation: 'sensitive_masked',
      taxInformation: 'sensitive_masked',
      governmentIdentification: 'sensitive_masked',
      jobTitle: 'hr_controlled',
      department: 'hr_controlled',
      manager: 'hr_controlled',
      employmentType: 'hr_controlled',
      status: 'hr_controlled',
      hireDate: 'hr_controlled',
    },
  };
}

function maskSensitiveObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, fieldValue]) => [key, maskSensitiveValue(fieldValue)]),
  );
}

export async function getEmployeeForUser(userId: string, email?: string | null) {
  const rows = await prisma.$queryRawUnsafe<EmployeeRow[]>(
    `SELECT e.id, e.user_id, e.employee_number, e.first_name, e.last_name, e.preferred_name,
            e.email, e.phone, e.job_title, e.employment_type, e.status, e.hire_date, e.location,
            e.manager_id, e.department_id, e.company_id, e.legal_name, e.business_unit,
            e.work_phone, e.profile_photo_url, e.personal_information, e.address,
            e.emergency_contacts, e.family_dependents, e.bank_information, e.tax_information,
            e.government_identification, e.education, e.work_experience, e.skills,
            e.certifications, e.languages, e.profile_completion, e.version,
            d.name AS department_name,
            concat_ws(' ', COALESCE(m.preferred_name, m.first_name), m.last_name) AS manager_name
     FROM "hr_employees" e
     LEFT JOIN "hr_departments" d ON d.id = e.department_id
     LEFT JOIN "hr_employees" m ON m.id = e.manager_id
     WHERE e."user_id" = $1::uuid OR lower(e."email") = lower($2)
     LIMIT 1`,
    userId,
    email || '',
  );
  return rows[0] || null;
}

export async function searchEssEmployees(userId: string, email: string | null | undefined, query: string) {
  const employee = await requireEmployee(userId, email);
  const term = query.trim();
  if (term.length < 2) return [];
  return prisma.$queryRawUnsafe<Array<{
    id: string;
    employeeNumber: string;
    name: string;
    jobTitle: string | null;
    department: string | null;
  }>>(
    `SELECT e.id, e.employee_number AS "employeeNumber",
            concat_ws(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS name,
            e.job_title AS "jobTitle", d.name AS department
     FROM "hr_employees" e
     LEFT JOIN "hr_departments" d ON d.id = e.department_id
     WHERE e.id <> $1::uuid
       AND e.status IN ('active', 'probation', 'onboarding')
       AND (($2::uuid IS NULL AND e.company_id IS NULL) OR e.company_id = $2::uuid)
       AND (concat_ws(' ', e.first_name, e.last_name, e.preferred_name, e.employee_number, e.email) ILIKE '%' || $3 || '%')
     ORDER BY e.first_name, e.last_name
     LIMIT 20`,
    employee.id,
    employee.company_id || null,
    term,
  );
}

async function requireEmployee(userId: string, email?: string | null) {
  const employee = await getEmployeeForUser(userId, email);
  if (!employee) throw new Error('NO_EMPLOYEE');
  return employee;
}

async function getEssSlices(employeeId: string) {
  const [
    onboarding,
    onboardingTasks,
    documents,
    leaveBalances,
    leaveRequests,
    attendance,
    shifts,
    payslips,
    learning,
    performance,
    goals,
    profileRequests,
    requests,
  ] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, template_id, status, progress, start_date, target_date, completed_at, updated_at
       FROM "hr_employee_onboarding"
       WHERE "employee_id" = $1::uuid
       ORDER BY "updated_at" DESC
       LIMIT 5`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT eo.id AS onboarding_id, ot.id AS task_id, ot.title, ot.description, ot.owner_role, ot.sort_order,
              COALESCE(tp.status, 'pending') AS status, tp.completed_at
       FROM "hr_employee_onboarding" eo
       JOIN "hr_onboarding_tasks" ot ON ot.template_id = eo.template_id
       LEFT JOIN "hr_employee_onboarding_task_progress" tp ON tp.onboarding_id = eo.id AND tp.task_id = ot.id
       WHERE eo."employee_id" = $1::uuid
       ORDER BY eo.updated_at DESC, ot.sort_order ASC
       LIMIT 30`,
      employeeId,
    ).catch(() => []),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, title, type, category, status, file_path, expires_at, issue_date,
              confidentiality_level, version_number, requires_acknowledgment,
              acknowledged_at, mime_type, file_size, updated_at
       FROM "hr_employee_documents"
       WHERE "employee_id" = $1::uuid AND "status" <> 'archived'
       ORDER BY "updated_at" DESC
       LIMIT 30`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT lb.id, lp.id AS policy_id, lp.name, lp.leave_type, lb.year, lb.allocated, lb.accrued,
              lb.used, lb.pending, lb.reserved, lb.carry_forward, lb.expiring, lp.allow_half_day, lp.allow_hourly,
              lp.allow_backdated, lp.exclude_weekends, lp.exclude_holidays,
              lp.minimum_notice_days, lp.maximum_consecutive_days,
              lp.attachment_required_after_days, lp.expires_on
       FROM "hr_leave_balances" lb
       LEFT JOIN "hr_leave_policies" lp ON lp.id = lb.policy_id
       WHERE lb."employee_id" = $1::uuid
       ORDER BY lb.year DESC, lp.name ASC
       LIMIT 20`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT lr.id, lr.request_id, lr.policy_id, lr.start_date, lr.end_date, lr.days, lr.reason, lr.status,
              lr.request_unit, lr.half_day_period, lr.requested_hours, lr.emergency_contact,
              lr.handover_information, lr.acting_employee_id, lr.attachments, lr.approver_comments,
              lr.submitted_at, lr.withdrawn_at, lr.cancelled_at, lr.version, lr.decided_at, lr.created_at,
              lr.request_group_id, lr.segment_index,
              NULLIF(TRIM(CONCAT_WS(' ', acting.preferred_name, acting.first_name, acting.last_name)), '') AS acting_employee_name,
              acting.job_title AS acting_employee_job_title
       FROM "hr_leave_requests" lr
       LEFT JOIN "hr_employees" acting ON acting.id = lr.acting_employee_id
       WHERE lr."employee_id" = $1::uuid
       ORDER BY lr."created_at" DESC
       LIMIT 30`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, work_date, clock_in, clock_out, hours_worked, break_minutes,
              overtime_hours, late_minutes, early_departure_minutes, work_location,
              attendance_note, open_break_started_at, version, status, source
       FROM "hr_attendance_records"
       WHERE "employee_id" = $1::uuid
       ORDER BY "work_date" DESC
       LIMIT 30`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT sa.id, sa.shift_date, sa.start_time, sa.end_time, sa.status, ws.name AS schedule_name
       FROM "hr_shift_assignments" sa
       LEFT JOIN "hr_work_schedules" ws ON ws.id = sa.schedule_id
       WHERE sa."employee_id" = $1::uuid
       ORDER BY sa.shift_date DESC
       LIMIT 20`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, status, file_path, published_at, created_at
       FROM "hr_payslips"
       WHERE "employee_id" = $1::uuid AND "status" = 'published'
       ORDER BY "published_at" DESC NULLS LAST, "created_at" DESC
       LIMIT 30`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT le.id, le.status, le.progress, le.due_date, le.completed_at, lc.title, lc.category, lc.duration_hours
       FROM "hr_learning_enrollments" le
       LEFT JOIN "hr_learning_courses" lc ON lc.id = le.course_id
       WHERE le."employee_id" = $1::uuid
       ORDER BY le."updated_at" DESC
       LIMIT 30`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT pr.id, pr.status, pr.rating, pr.summary, pr.self_assessment,
              pr.competency_assessment, pr.employee_comments, pr.manager_assessment,
              pr.development_plan, pr.submitted_at, pr.acknowledged_at, pr.version,
              pr.completed_at, pr.updated_at, pc.name AS cycle_name,
              pc.start_date AS cycle_start_date, pc.end_date AS cycle_end_date
       FROM "hr_performance_reviews" pr
       LEFT JOIN "hr_performance_cycles" pc ON pc.id = pr.cycle_id
       WHERE pr."employee_id" = $1::uuid
       ORDER BY pr."updated_at" DESC
       LIMIT 20`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, title, description, status, progress, due_date, key_results,
              comments, evidence, approval_status, version
       FROM "hr_performance_goals"
       WHERE "employee_id" = $1::uuid
       ORDER BY "updated_at" DESC
       LIMIT 20`,
      employeeId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, request_id, field, current_value, requested_value, reason, status,
              requested_values, original_values, supporting_documents, approver_comments,
              submitted_at, withdrawn_at, version, decided_at, created_at
       FROM "hr_employee_profile_change_requests"
       WHERE "employee_id" = $1::uuid
       ORDER BY "created_at" DESC
       LIMIT 10`,
      employeeId,
    ).catch(() => []),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT r.*,
              COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'action', a.action,
                    'fromStatus', a.from_status,
                    'toStatus', a.to_status,
                    'comment', a.comment,
                    'createdAt', a.created_at
                  ) ORDER BY a.created_at
                ) FILTER (WHERE a.id IS NOT NULL),
                '[]'::jsonb
              ) AS activity
       FROM "hr_ess_requests" r
       LEFT JOIN "hr_ess_request_activities" a ON a.request_id = r.id
       WHERE r.requester_employee_id = $1::uuid
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT 100`,
      employeeId,
    ).catch(() => []),
  ]);

  return {
    onboarding,
    onboardingTasks,
    documents,
    leaveBalances,
    leaveRequests,
    attendance,
    shifts,
    payslips,
    learning,
    performance,
    goals,
    profileRequests,
    requests,
  };
}

export async function getEssDashboard(userId: string, email?: string | null) {
  const employee = await getEmployeeForUser(userId, email);
  if (!employee) return null;
  const slices = await getEssSlices(employee.id);
  const directReports = await listDirectReports(employee.id);

  return {
    employee: mapEmployee(employee),
    ...slices,
    metrics: {
      openLeaveRequests: slices.leaveRequests.filter(item => item.status === 'pending').length,
      pendingDocuments: slices.documents.filter(item => item.status === 'pending').length,
      activeLearning: slices.learning.filter(item => item.status !== 'completed').length,
      latestOnboardingProgress: Number(slices.onboarding[0]?.progress || 0),
      directReports: directReports.length,
    },
    actions: buildEssActions(slices, directReports.length),
  };
}

export async function getOwnAttendanceClock(userId: string, email?: string | null) {
  const employee = await requireEmployee(userId, email);
  const { start, end } = getLocalDayBounds();
  const [today, recent] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, work_date, clock_in, clock_out, hours_worked, break_minutes,
              overtime_hours, late_minutes, early_departure_minutes, work_location,
              attendance_note, open_break_started_at, version, status, source
       FROM "hr_attendance_records"
       WHERE "employee_id" = $1::uuid AND "work_date" >= $2 AND "work_date" < $3
       ORDER BY "work_date" DESC
       LIMIT 1`,
      employee.id,
      start,
      end,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, work_date, clock_in, clock_out, hours_worked, break_minutes,
              overtime_hours, late_minutes, early_departure_minutes, work_location,
              attendance_note, open_break_started_at, version, status, source
       FROM "hr_attendance_records"
       WHERE "employee_id" = $1::uuid
       ORDER BY "work_date" DESC
       LIMIT 30`,
      employee.id,
    ),
  ]);

  return { employee: mapEmployee(employee), today: today[0] || null, recent };
}

export async function clockOwnAttendance(
  userId: string,
  email: string | null | undefined,
  input: z.infer<typeof essAttendanceActionSchema>,
) {
  const employee = await requireEmployee(userId, email);
  const now = new Date();
  const { start, end } = getLocalDayBounds(now);
  const requiresGps = input.action === 'clock_in' || input.action === 'clock_out';
  if (requiresGps && (input.latitude == null || input.longitude == null)) {
    throw new Error('GPS location is required to check in or check out. Enable location access and try again.');
  }
  const geofenceMatch = requiresGps
    ? validateAttendanceGeofence(
        { latitude: Number(input.latitude), longitude: Number(input.longitude) },
        await getAttendanceGeofences(),
      )
    : null;
  if (input.idempotencyKey) {
    const replay = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ar.*, TRUE AS replayed
       FROM "hr_attendance_events" ae
       LEFT JOIN "hr_attendance_records" ar ON ar.id = ae.attendance_record_id
       WHERE ae.employee_id = $1::uuid AND ae.idempotency_key = $2
       LIMIT 1`,
      employee.id,
      input.idempotencyKey,
    ).catch(() => []);
    if (replay[0]?.id) return replay[0];
  }
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown> & {
    id: string;
    clock_in: Date | null;
    clock_out: Date | null;
    open_break_started_at: Date | null;
    break_minutes: number;
  }>>(
    `SELECT id, work_date, clock_in, clock_out, hours_worked, break_minutes,
            overtime_hours, late_minutes, early_departure_minutes, work_location,
            attendance_note, open_break_started_at, version, status, source
     FROM "hr_attendance_records"
     WHERE "employee_id" = $1::uuid AND "work_date" >= $2 AND "work_date" < $3
     ORDER BY "work_date" DESC
     LIMIT 1`,
    employee.id,
    start,
    end,
  );
  const current = rows[0] || null;
  const runWithAttendanceEvent = async (
    operation: () => Promise<Record<string, unknown>>,
  ) => {
    if (!input.idempotencyKey) return operation();
    const eventId = randomUUID();
    const reserved = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO "hr_attendance_events"
        (id, attendance_record_id, employee_id, event_type, occurred_at,
         logical_shift_date, source, work_location, latitude, longitude,
         location_accuracy_meters, location_validation_status, device_id,
         idempotency_key, actor_user_id, created_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::date, 'web', $7, $8, $9,
               $10, $11, $12, $13, $14::uuid, CURRENT_TIMESTAMP)
       ON CONFLICT (employee_id, idempotency_key) DO NOTHING
       RETURNING id`,
      eventId,
      current?.id || null,
      employee.id,
      input.action,
      now,
      start,
      input.workLocation || current?.work_location || null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.locationAccuracyMeters ?? null,
      geofenceMatch ? 'inside_geofence' : input.latitude !== undefined && input.longitude !== undefined ? 'recorded' : 'not_requested',
      input.deviceId || null,
      input.idempotencyKey,
      userId,
    ).catch(() => []);
    if (!reserved[0]) {
      const replay = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT ar.*, TRUE AS replayed
         FROM "hr_attendance_events" ae
         LEFT JOIN "hr_attendance_records" ar ON ar.id = ae.attendance_record_id
         WHERE ae.employee_id = $1::uuid AND ae.idempotency_key = $2
         LIMIT 1`,
        employee.id,
        input.idempotencyKey,
      );
      if (replay[0]?.id) return replay[0];
      throw new Error('This attendance action is already being processed.');
    }
    try {
      const result = await operation();
      await prisma.$executeRawUnsafe(
        `UPDATE "hr_attendance_events"
         SET attendance_record_id = $2::uuid
         WHERE id = $1::uuid`,
        eventId,
        result.id,
      );
      return result;
    } catch (error) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "hr_attendance_events" WHERE id = $1::uuid`,
        eventId,
      ).catch(() => null);
      throw error;
    }
  };

  if (input.action === 'start_break') {
    if (!current?.clock_in || current.clock_out) throw new Error('Clock in before starting a break.');
    if (current.open_break_started_at) throw new Error('A break is already in progress.');
    return runWithAttendanceEvent(async () => {
      const data = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_attendance_records"
         SET "open_break_started_at" = $1, "attendance_note" = COALESCE($2, "attendance_note"),
             "version" = "version" + 1, "updated_at" = NOW()
         WHERE "id" = $3::uuid AND "employee_id" = $4::uuid AND "open_break_started_at" IS NULL
         RETURNING *`,
        now,
        input.note || null,
        current.id,
        employee.id,
      );
      if (!data[0]) throw new Error('Attendance changed while this action was being processed.');
      return data[0];
    });
  }

  if (input.action === 'end_break') {
    if (!current?.open_break_started_at) throw new Error('No break is currently in progress.');
    const addedMinutes = Math.max(0, Math.round((now.getTime() - new Date(current.open_break_started_at).getTime()) / 60_000));
    return runWithAttendanceEvent(async () => {
      const data = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `UPDATE "hr_attendance_records"
         SET "open_break_started_at" = NULL, "break_minutes" = "break_minutes" + $1,
             "attendance_note" = COALESCE($2, "attendance_note"),
             "version" = "version" + 1, "updated_at" = NOW()
         WHERE "id" = $3::uuid AND "employee_id" = $4::uuid AND "open_break_started_at" IS NOT NULL
         RETURNING *`,
        addedMinutes,
        input.note || null,
        current.id,
        employee.id,
      );
      if (!data[0]) throw new Error('Attendance changed while this action was being processed.');
      return data[0];
    });
  }

  if (input.action === 'clock_in') {
    if (current?.clock_in && !current.clock_out) throw new Error('You are already clocked in.');
    if (current?.clock_out) throw new Error('Today attendance has already been completed.');

    return runWithAttendanceEvent(async () => {
      const data = current
        ? await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
            `UPDATE "hr_attendance_records"
             SET "clock_in" = $1, "status" = 'present', "source" = 'clock',
                 "work_location" = $4, "latitude" = $5, "longitude" = $6,
                 "attendance_note" = $7, "version" = "version" + 1, "updated_at" = NOW()
             WHERE "id" = $2::uuid AND "employee_id" = $3::uuid
             RETURNING *`,
            now,
            current.id,
            employee.id,
            input.workLocation || 'office',
            input.latitude ?? null,
            input.longitude ?? null,
            input.note || null,
          )
        : await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
            `INSERT INTO "hr_attendance_records"
              ("id", "employee_id", "work_date", "clock_in", "hours_worked", "status",
               "source", "work_location", "latitude", "longitude", "attendance_note",
               "created_at", "updated_at")
             VALUES ($1::uuid, $2::uuid, $3, $4, 0, 'present', 'clock', $5, $6, $7, $8,
                     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            randomUUID(),
            employee.id,
            start,
            now,
            input.workLocation || 'office',
            input.latitude ?? null,
            input.longitude ?? null,
            input.note || null,
          );
      return data[0];
    });
  }

  if (!current?.clock_in || current.clock_out) throw new Error('Clock in before clocking out.');
  if (current.open_break_started_at) throw new Error('End the active break before clocking out.');

  const hoursWorked = Math.max(0, calculateAttendanceHours(new Date(current.clock_in), now) - Number(current.break_minutes || 0) / 60);
  return runWithAttendanceEvent(async () => {
    const data = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_attendance_records"
       SET "clock_out" = $1, "hours_worked" = $2, "status" = 'checked_out', "source" = 'clock',
           "worked_minutes" = ROUND($2 * 60), "regular_minutes" = ROUND($2 * 60),
           "attendance_note" = COALESCE($5, "attendance_note"),
           "version" = "version" + 1, "updated_at" = NOW()
       WHERE "id" = $3::uuid AND "employee_id" = $4::uuid
       RETURNING *`,
      now,
      hoursWorked,
      current.id,
      employee.id,
      input.note || null,
    );
    if (!data[0]) throw new Error('Attendance changed while this action was being processed.');
    return data[0];
  });
}

function buildEssActions(slices: Awaited<ReturnType<typeof getEssSlices>>, directReportCount: number) {
  const actions = [];
  if (slices.leaveRequests.some(item => item.status === 'pending')) actions.push({ label: 'Leave request pending', href: '/ess/leave' });
  if (slices.documents.some(item => item.status === 'pending')) actions.push({ label: 'Upload requested document', href: '/ess/documents' });
  if (slices.learning.some(item => item.status !== 'completed')) actions.push({ label: 'Continue learning', href: '/ess/learning' });
  if (slices.onboardingTasks.some(item => item.status !== 'completed')) actions.push({ label: 'Continue onboarding', href: '/ess/onboarding' });
  if (directReportCount > 0) actions.push({ label: 'Review team approvals', href: '/ess/team' });
  return actions;
}

export async function listDirectReports(managerEmployeeId: string) {
  const rows = await prisma.$queryRawUnsafe<EmployeeRow[]>(
    `SELECT id, user_id, employee_number, first_name, last_name, preferred_name, email, phone, job_title, employment_type, status, hire_date, location, manager_id
     FROM "hr_employees"
     WHERE "manager_id" = $1::uuid
     ORDER BY "first_name" ASC, "last_name" ASC`,
    managerEmployeeId,
  );
  return rows.map(mapEmployee);
}

export async function getEssTeamDashboard(userId: string, email?: string | null) {
  const manager = await requireEmployee(userId, email);
  const reports = await listDirectReports(manager.id);
  const reportIds = reports.map(report => report.id);
  const pendingLeave = reportIds.length === 0 ? [] : await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT lr.id, lr.employee_id, lr.start_date, lr.end_date, lr.days, lr.reason, lr.status, e.first_name, e.last_name, e.preferred_name, e.job_title
     FROM "hr_leave_requests" lr
     JOIN "hr_employees" e ON e.id = lr.employee_id
     WHERE e.manager_id = $1::uuid AND lr.status = 'pending'
     ORDER BY lr.created_at ASC
     LIMIT 50`,
    manager.id,
  );
  const attendanceExceptions = reportIds.length === 0 ? [] : await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT ar.id, ar.employee_id, ar.work_date, ar.hours_worked, ar.status, e.first_name, e.last_name, e.preferred_name
     FROM "hr_attendance_records" ar
     JOIN "hr_employees" e ON e.id = ar.employee_id
     WHERE e.manager_id = $1::uuid AND ar.status IN ('late', 'absent')
     ORDER BY ar.work_date DESC
     LIMIT 30`,
    manager.id,
  );
  const onboardingFollowUp = reportIds.length === 0 ? [] : await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT eo.id, eo.employee_id, eo.status, eo.progress, eo.target_date, e.first_name, e.last_name, e.preferred_name
     FROM "hr_employee_onboarding" eo
     JOIN "hr_employees" e ON e.id = eo.employee_id
     WHERE e.manager_id = $1::uuid AND eo.status <> 'completed'
     ORDER BY eo.target_date ASC NULLS LAST
     LIMIT 30`,
    manager.id,
  );
  const availability = reportIds.length === 0 ? [] : await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT e.id AS employee_id,
            concat_ws(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS employee_name,
            day::date AS availability_date,
            CASE
              WHEN EXISTS (
                SELECT 1 FROM "hr_leave_requests" lr
                WHERE lr.employee_id = e.id AND lr.status = 'approved'
                  AND day::date BETWEEN lr.start_date::date AND lr.end_date::date
              ) THEN 'on_leave'
              WHEN EXISTS (
                SELECT 1 FROM "hr_holidays" h
                WHERE h.holiday_date::date = day::date
                  AND (h.location IS NULL OR lower(h.location) = lower(COALESCE(e.location, '')))
              ) THEN 'public_holiday'
              WHEN EXISTS (
                SELECT 1 FROM "hr_attendance_records" ar
                WHERE ar.employee_id = e.id AND ar.work_date::date = day::date
                  AND ar.work_location = 'remote'
              ) THEN 'work_from_home'
              WHEN EXISTS (
                SELECT 1 FROM "hr_shift_assignments" sa
                WHERE sa.employee_id = e.id AND sa.shift_date::date = day::date
              ) THEN 'scheduled_shift'
              ELSE 'working'
            END AS availability_status
     FROM "hr_employees" e
     CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + 6, INTERVAL '1 day') AS day
     WHERE e.manager_id = $1::uuid
     ORDER BY e.first_name, e.last_name, day`,
    manager.id,
  );

  return {
    manager: mapEmployee(manager),
    reports,
    pendingLeave,
    attendanceExceptions,
    onboardingFollowUp,
    availability,
    metrics: {
      directReports: reports.length,
      pendingLeave: pendingLeave.length,
      attendanceExceptions: attendanceExceptions.length,
      onboardingFollowUp: onboardingFollowUp.length,
    },
  };
}

export async function createEssLeaveRequest(userId: string, email: string | null | undefined, input: EssLeaveRequestInput) {
  const employee = await requireEmployee(userId, email);
  const emergencyContacts = Array.isArray(employee.emergency_contacts) ? employee.emergency_contacts : [];
  const allowedEmergencyContacts = emergencyContacts.map((contact, index) => {
    if (!contact || typeof contact !== 'object') return String(contact || '').trim();
    const record = contact as Record<string, unknown>;
    const name = String(record.name || record.fullName || record.contactName || `Emergency contact ${index + 1}`);
    const relationship = String(record.relationship || record.relation || '').trim();
    const phone = String(record.phone || record.phoneNumber || record.mobile || '').trim();
    return JSON.stringify({ name, relationship: relationship || undefined, phone: phone || undefined }).slice(0, 500);
  }).filter(Boolean);
  if (!allowedEmergencyContacts.includes(input.emergencyContact)) {
    throw new Error('Select an emergency contact from your saved Emergency Contacts list.');
  }
  if (input.actingEmployeeId) {
    const actingEmployees = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "hr_employees"
       WHERE id = $1::uuid AND id <> $2::uuid
         AND status IN ('active', 'probation', 'onboarding')
         AND (($3::uuid IS NULL AND company_id IS NULL) OR company_id = $3::uuid)
       LIMIT 1`,
      input.actingEmployeeId,
      employee.id,
      employee.company_id || null,
    );
    if (!actingEmployees[0]) throw new Error('Select an active acting employee from the employee search.');
  }
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf()) || endDate < startDate) {
    throw new Error('Leave dates are invalid.');
  }

  const fallbackPolicy = input.policyId ? null : await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "hr_leave_policies" WHERE "is_active" = true ORDER BY "created_at" ASC LIMIT 1`,
  );
  const policyId = input.policyId || fallbackPolicy?.[0]?.id || null;
  if (!policyId) throw new Error('No active leave policy is available.');

  const policies = await prisma.$queryRawUnsafe<Array<{
    id: string;
    name: string;
    requires_approval: boolean;
    allow_half_day: boolean;
    allow_hourly: boolean;
    allow_backdated: boolean;
    exclude_weekends: boolean;
    exclude_holidays: boolean;
    minimum_notice_days: number;
    maximum_consecutive_days: number | null;
    attachment_required_after_days: number | null;
  }>>(
    `SELECT id, name, requires_approval, allow_half_day, allow_hourly, allow_backdated,
            exclude_weekends, exclude_holidays, minimum_notice_days,
            maximum_consecutive_days, attachment_required_after_days
     FROM "hr_leave_policies"
     WHERE id = $1::uuid AND is_active = true
     LIMIT 1`,
    policyId,
  );
  const policy = policies[0];
  if (!policy) throw new Error('The selected leave policy is not available.');
  if (input.requestUnit === 'half_day' && !policy.allow_half_day) throw new Error('Half-day leave is not allowed by this policy.');
  if (input.requestUnit === 'hourly' && !policy.allow_hourly) throw new Error('Hourly leave is not allowed by this policy.');
  if (input.requestUnit === 'hourly' && !input.requestedHours) throw new Error('Requested hours are required for hourly leave.');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!policy.allow_backdated && startDate < today) throw new Error('Backdated leave is not permitted by this policy.');
  const noticeDays = Math.floor((startDate.getTime() - today.getTime()) / 86_400_000);
  if (noticeDays < Number(policy.minimum_notice_days || 0)) {
    throw new Error(`This policy requires at least ${policy.minimum_notice_days} day(s) notice.`);
  }

  const overlapping = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "hr_leave_requests"
     WHERE "employee_id" = $1::uuid
       AND "status" NOT IN ('rejected', 'withdrawn', 'cancelled')
       AND "start_date" <= $3
       AND "end_date" >= $2
     LIMIT 1`,
    employee.id,
    startDate,
    endDate,
  );
  if (overlapping[0]) throw new Error('This request overlaps another active leave request.');

  const blockedPeriods = await prisma.$queryRawUnsafe<{ name: string; reason: string | null }[]>(
    `SELECT lb."name", lb."reason"
     FROM "hr_leave_blocks" lb
     LEFT JOIN "hr_leave_policies" lp ON lp."id" = $5::uuid
     LEFT JOIN "hr_departments" d ON d."id" = $4::uuid
     WHERE lb."is_active" = true
       AND lb."start_date" <= $2
       AND lb."end_date" >= $1
       AND (lb."leave_type" = 'all' OR lb."leave_type" = COALESCE(lp."leave_type", 'all'))
       AND (
         lb."scope" = 'all'
         OR (lb."scope" = 'location' AND lower(COALESCE(lb."target_value", '')) = lower($3))
         OR (
           lb."scope" = 'department'
           AND (
             lb."target_value" = COALESCE($4::text, '')
             OR lower(COALESCE(lb."target_value", '')) = lower(COALESCE(d."name", ''))
             OR lower(COALESCE(lb."target_value", '')) = lower(COALESCE(d."department", ''))
           )
         )
       )
     ORDER BY lb."start_date" ASC
     LIMIT 1`,
    startDate,
    endDate,
    employee.location || '',
    employee.department_id || null,
    policyId,
  );
  if (blockedPeriods[0]) {
    const block = blockedPeriods[0];
    throw new Error(`Leave requests are blocked for this period: ${block.name}${block.reason ? ` - ${block.reason}` : ''}`);
  }
  const holidays = policy.exclude_holidays
    ? await prisma.$queryRawUnsafe<{ holiday_date: Date }[]>(
        `SELECT holiday_date FROM "hr_holidays"
         WHERE holiday_date >= $1 AND holiday_date <= $2
           AND (location IS NULL OR lower(location) = lower($3))`,
        startDate,
        endDate,
        employee.location || '',
      )
    : [];
  let days = calculateWorkingLeaveDays({
    startDate,
    endDate,
    excludeWeekends: policy.exclude_weekends,
    holidayDates: holidays.map(item => new Date(item.holiday_date).toISOString().slice(0, 10)),
  });
  if (input.requestUnit === 'half_day') days = 0.5;
  if (input.requestUnit === 'hourly') days = Number(input.requestedHours || 0) / 8;
  if (days <= 0) throw new Error('The selected dates contain no eligible working time.');
  if (policy.maximum_consecutive_days && days > policy.maximum_consecutive_days) {
    throw new Error(`This policy allows at most ${policy.maximum_consecutive_days} consecutive day(s).`);
  }
  if (policy.attachment_required_after_days && days >= policy.attachment_required_after_days) {
    throw new Error(`Supporting documentation is required for requests of ${policy.attachment_required_after_days} day(s) or more.`);
  }

  const requestUuid = randomUUID();
  const requestId = `LVR-${requestUuid.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  const status = input.saveAsDraft ? 'draft' : policy.requires_approval ? 'pending_approval' : 'approved';
  const rows = await prisma.$transaction(async tx => {
    const balances = await tx.$queryRawUnsafe<Array<{ id: string; available: number }>>(
      `SELECT id, (allocated + accrued + carry_forward - used - pending - reserved) AS available
       FROM "hr_leave_balances"
       WHERE employee_id = $1::uuid AND policy_id = $2::uuid AND year = $3
       FOR UPDATE`,
      employee.id,
      policyId,
      startDate.getFullYear(),
    );
    const balance = balances[0];
    if (!balance) throw new Error('No leave balance is assigned for the selected policy and year.');
    if (Number(balance.available) < days) throw new Error(`This request exceeds the available balance of ${Number(balance.available)} day(s).`);

    const inserted = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO "hr_leave_requests"
        ("id", "request_id", "employee_id", "policy_id", "start_date", "end_date",
         "days", "reason", "status", "request_unit", "half_day_period", "requested_hours",
         "emergency_contact", "handover_information", "acting_employee_id", "submitted_at",
         "created_at", "updated_at")
       VALUES
        ($1::uuid, $2, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10, $11, $12,
         $13, $14, $15::uuid, CASE WHEN $9 = 'draft' THEN NULL ELSE CURRENT_TIMESTAMP END,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      requestUuid,
      requestId,
      employee.id,
      policyId,
      startDate,
      endDate,
      days,
      input.reason || null,
      status,
      input.requestUnit,
      input.halfDayPeriod || null,
      input.requestedHours || null,
      input.emergencyContact || null,
      input.handoverInformation || null,
      input.actingEmployeeId || null,
    );
    if (!input.saveAsDraft) {
      await tx.$executeRawUnsafe(
        `UPDATE "hr_leave_balances"
         SET "${policy.requires_approval ? 'pending' : 'used'}" = "${policy.requires_approval ? 'pending' : 'used'}" + $2,
             "updated_at" = CURRENT_TIMESTAMP
         WHERE id = $1::uuid`,
        balance.id,
        days,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_leave_balance_ledger"
          ("id", "employee_id", "policy_id", "balance_id", "transaction_type", "units",
           "balance_before", "balance_after", "effective_date", "source_type", "source_id",
           "idempotency_key", "reason", "actor_id", "metadata", "created_at")
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, CURRENT_DATE,
                 'leave_request', $9::uuid, $10, $11, $12::uuid, $13::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT ("idempotency_key") DO NOTHING`,
        randomUUID(),
        employee.id,
        policyId,
        balance.id,
        policy.requires_approval ? 'request_reservation' : 'leave_usage_deduction',
        -days,
        Number(balance.available),
        Number(balance.available) - days,
        requestUuid,
        `leave-request-submit:${requestUuid}`,
        input.reason || null,
        userId,
        JSON.stringify({ requestId, requestUnit: input.requestUnit }),
      );
    }
    return inserted;
  });
  if (!input.saveAsDraft && employee.manager_id) {
    const managerRows = await prisma.$queryRawUnsafe<{ user_id: string | null }[]>(
      `SELECT user_id FROM "hr_employees" WHERE id = $1::uuid LIMIT 1`,
      employee.manager_id,
    );
    const managerUserId = managerRows[0]?.user_id;
    if (managerUserId) {
      await NotificationService.createNotification(managerUserId, {
        type: 'ess_leave_submitted',
        title: 'Leave request needs your review',
        message: `${employeeName(employee)} submitted ${days.toFixed(1)} day(s) of leave.`,
        data: { href: '/ess/team', leaveRequestId: requestUuid, requestId },
      }, userId).catch(() => null);
    }
  }
  return rows[0];
}

export async function createEssGroupedLeaveRequest(
  userId: string,
  email: string | null | undefined,
  input: EssGroupedLeaveRequestInput,
) {
  const segments = input.segments?.length ? input.segments : [{
    startDate: input.startDate!,
    endDate: input.endDate!,
    policyId: input.policyId,
    requestUnit: input.requestUnit || 'full_day',
    halfDayPeriod: input.halfDayPeriod,
    requestedHours: input.requestedHours,
  }];

  for (let index = 0; index < segments.length; index += 1) {
    for (let compare = index + 1; compare < segments.length; compare += 1) {
      const left = segments[index];
      const right = segments[compare];
      if (left.startDate <= right.endDate && left.endDate >= right.startDate) {
        throw new Error(`Leave segment ${index + 1} overlaps segment ${compare + 1}.`);
      }
    }
  }

  const requestGroupId = randomUUID();
  const created: Record<string, unknown>[] = [];
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const row = await createEssLeaveRequest(userId, email, {
      ...segment,
      reason: input.reason,
      emergencyContact: input.emergencyContact,
      handoverInformation: input.handoverInformation,
      actingEmployeeId: input.actingEmployeeId,
      saveAsDraft: input.saveAsDraft,
    });
    await prisma.$executeRawUnsafe(
      `UPDATE "hr_leave_requests" SET request_group_id = $2::uuid, segment_index = $3 WHERE id = $1::uuid`,
      String(row?.id), requestGroupId, index,
    );
    created.push(row || {});
  }
  return { id: requestGroupId, requestGroupId, segments: created, segmentCount: created.length };
}

export async function cancelOwnLeaveRequest(
  userId: string,
  email: string | null | undefined,
  id: string,
  action: 'cancel' | 'withdraw' | 'resubmit' | 'submit' = 'cancel',
  expectedVersion?: number,
) {
  const employee = await requireEmployee(userId, email);
  const targetStatus = action === 'withdraw' ? 'withdrawn' : action === 'resubmit' || action === 'submit' ? 'pending_approval' : 'cancelled';
  const allowedStatuses = action === 'submit'
    ? ['draft']
    : action === 'resubmit'
      ? ['returned_for_revision', 'withdrawn']
      : action === 'withdraw'
        ? ['pending', 'submitted', 'pending_approval', 'returned_for_revision']
        : ['pending', 'submitted', 'pending_approval', 'approved'];
  const result = await prisma.$transaction(async tx => {
    const currentRows = await tx.$queryRawUnsafe<Array<{
      id: string;
      status: string;
      policy_id: string | null;
      days: number;
      version: number;
      start_date: Date;
    }>>(
      `SELECT id, status, policy_id, days, version, start_date
       FROM "hr_leave_requests"
       WHERE id = $1::uuid AND employee_id = $2::uuid
       FOR UPDATE`,
      id,
      employee.id,
    );
    const current = currentRows[0];
    if (!current || !allowedStatuses.includes(current.status) || (expectedVersion && current.version !== expectedVersion)) return null;

    if (current.policy_id) {
      const balanceRows = await tx.$queryRawUnsafe<Array<{ id: string; available: number }>>(
        `SELECT id, (allocated + accrued + carry_forward - used - pending - reserved) AS available
         FROM "hr_leave_balances"
         WHERE employee_id = $1::uuid AND policy_id = $2::uuid AND year = $3
         FOR UPDATE`,
        employee.id,
        current.policy_id,
        current.start_date.getFullYear(),
      );
      const balance = balanceRows[0];
      if (balance) {
        const resubmitting = targetStatus === 'pending_approval' && ['draft', 'returned_for_revision', 'withdrawn'].includes(current.status);
        if (resubmitting && Number(balance.available) < Number(current.days)) {
          throw new Error(`This request now exceeds the available balance of ${Number(balance.available)} day(s).`);
        }
        await tx.$executeRawUnsafe(
          `UPDATE "hr_leave_balances"
           SET "pending" = GREATEST(0, "pending"
                 + CASE WHEN $3 THEN $2 ELSE 0 END
                 - CASE WHEN $4 THEN $2 ELSE 0 END),
               "used" = GREATEST(0, "used" - CASE WHEN $5 THEN $2 ELSE 0 END),
               "updated_at" = CURRENT_TIMESTAMP
           WHERE id = $1::uuid`,
          balance.id,
          Number(current.days),
          resubmitting,
          ['pending', 'submitted', 'pending_approval'].includes(current.status) && ['withdrawn', 'cancelled'].includes(targetStatus),
          current.status === 'approved' && targetStatus === 'cancelled',
        );
        const releasesUnits = ['pending', 'submitted', 'pending_approval'].includes(current.status) && ['withdrawn', 'cancelled'].includes(targetStatus);
        const restoresUnits = current.status === 'approved' && targetStatus === 'cancelled';
        if (resubmitting || releasesUnits || restoresUnits) {
          const delta = resubmitting ? -Number(current.days) : Number(current.days);
          await tx.$executeRawUnsafe(
            `INSERT INTO "hr_leave_balance_ledger"
              ("id", "employee_id", "policy_id", "balance_id", "transaction_type", "units",
               "balance_before", "balance_after", "effective_date", "source_type", "source_id",
               "idempotency_key", "actor_id", "metadata", "created_at")
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, CURRENT_DATE,
                     'leave_request', $9::uuid, $10, $11::uuid, $12::jsonb, CURRENT_TIMESTAMP)
             ON CONFLICT ("idempotency_key") DO NOTHING`,
            randomUUID(),
            employee.id,
            current.policy_id,
            balance.id,
            resubmitting ? 'request_reservation' : restoresUnits ? 'cancellation_restoration' : 'request_reservation_release',
            delta,
            Number(balance.available),
            Number(balance.available) + delta,
            current.id,
            `leave-request-action:${current.id}:${action}:${current.version}`,
            userId,
            JSON.stringify({ action, previousStatus: current.status, targetStatus }),
          );
        }
      }
    }

    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_leave_requests"
       SET "status" = $3, "version" = "version" + 1,
           "submitted_at" = CASE WHEN $3 = 'pending_approval' THEN CURRENT_TIMESTAMP ELSE "submitted_at" END,
           "withdrawn_at" = CASE WHEN $3 = 'withdrawn' THEN CURRENT_TIMESTAMP ELSE "withdrawn_at" END,
           "cancelled_at" = CASE WHEN $3 = 'cancelled' THEN CURRENT_TIMESTAMP ELSE "cancelled_at" END,
           "updated_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1::uuid AND "employee_id" = $2::uuid
       RETURNING *`,
      id,
      employee.id,
      targetStatus,
    );
    return rows[0] || null;
  });
  return result;
}

export async function createProfileChangeRequest(userId: string, email: string | null | undefined, input: EssProfileRequestInput) {
  const employee = await requireEmployee(userId, email);
  const fieldColumn: Record<EssProfileRequestInput['field'], keyof EmployeeRow> = {
    preferredName: 'preferred_name',
    phone: 'phone',
    location: 'location',
  };
  const currentValue = employee[fieldColumn[input.field]];
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `INSERT INTO "hr_employee_profile_change_requests"
      ("id", "employee_id", "field", "current_value", "requested_value", "reason", "status",
       "created_at", "updated_at")
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    randomUUID(),
    employee.id,
    input.field,
    currentValue ? String(currentValue) : null,
    input.requestedValue,
    input.reason || null,
  );
  return rows[0];
}

export async function updateOwnLearning(userId: string, email: string | null | undefined, input: z.infer<typeof essLearningPatchSchema>) {
  const employee = await requireEmployee(userId, email);
  const nextStatus = input.action === 'complete' ? 'completed' : input.action === 'start' ? 'in_progress' : null;
  const nextProgress = input.action === 'complete' ? 100 : input.progress;
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE "hr_learning_enrollments"
     SET "status" = COALESCE($3, "status"),
         "progress" = COALESCE($4, "progress"),
         "completed_at" = CASE WHEN $3 = 'completed' THEN CURRENT_TIMESTAMP ELSE "completed_at" END,
         "updated_at" = CURRENT_TIMESTAMP
     WHERE "id" = $1::uuid AND "employee_id" = $2::uuid
     RETURNING *`,
    input.id,
    employee.id,
    nextStatus,
    nextProgress ?? null,
  );
  return rows[0] || null;
}

export async function updateOwnOnboarding(userId: string, email: string | null | undefined, input: z.infer<typeof essOnboardingPatchSchema>) {
  const employee = await requireEmployee(userId, email);
  if (input.action === 'start') {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_employee_onboarding"
       SET "status" = 'in_progress', "progress" = GREATEST("progress", 10), "start_date" = COALESCE("start_date", CURRENT_TIMESTAMP), "updated_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1::uuid AND "employee_id" = $2::uuid
       RETURNING *`,
      input.onboardingId,
      employee.id,
    );
    return rows[0] || null;
  }

  if (input.action === 'complete_case') {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_employee_onboarding"
       SET "status" = 'completed', "progress" = 100, "completed_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1::uuid AND "employee_id" = $2::uuid
       RETURNING *`,
      input.onboardingId,
      employee.id,
    );
    return rows[0] || null;
  }

  if (!input.taskId) throw new Error('Task ID is required.');
  const progressRows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `INSERT INTO "hr_employee_onboarding_task_progress"
      ("id", "onboarding_id", "task_id", "employee_id", "status", "completed_at",
       "created_at", "updated_at")
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'completed', CURRENT_TIMESTAMP,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT ("onboarding_id", "task_id")
     DO UPDATE SET "status" = 'completed', "completed_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
     RETURNING *`,
    randomUUID(),
    input.onboardingId,
    input.taskId,
    employee.id,
  );
  await recalculateOnboardingProgress(input.onboardingId, employee.id);
  return progressRows[0] || null;
}

async function recalculateOnboardingProgress(onboardingId: string, employeeId: string) {
  const rows = await prisma.$queryRawUnsafe<{ total: string | number; completed: string | number }[]>(
    `SELECT COUNT(ot.id) AS total, COUNT(tp.id) FILTER (WHERE tp.status = 'completed') AS completed
     FROM "hr_employee_onboarding" eo
     JOIN "hr_onboarding_tasks" ot ON ot.template_id = eo.template_id
     LEFT JOIN "hr_employee_onboarding_task_progress" tp ON tp.onboarding_id = eo.id AND tp.task_id = ot.id
     WHERE eo.id = $1::uuid AND eo.employee_id = $2::uuid`,
    onboardingId,
    employeeId,
  );
  const total = Number(rows[0]?.total || 0);
  const completed = Number(rows[0]?.completed || 0);
  if (total === 0) return;
  const progress = Math.round((completed / total) * 100);
  await prisma.$executeRawUnsafe(
    `UPDATE "hr_employee_onboarding"
     SET "progress" = $3, "status" = CASE WHEN $3 >= 100 THEN 'completed' ELSE 'in_progress' END,
         "completed_at" = CASE WHEN $3 >= 100 THEN CURRENT_TIMESTAMP ELSE "completed_at" END,
         "updated_at" = CURRENT_TIMESTAMP
     WHERE "id" = $1::uuid AND "employee_id" = $2::uuid`,
    onboardingId,
    employeeId,
    progress,
  );
}

export async function uploadOwnDocument({
  userId,
  email,
  file,
  documentId,
  title,
  type,
}: {
  userId: string;
  email?: string | null;
  file: File;
  documentId?: string | null;
  title?: string | null;
  type?: string | null;
}) {
  const employee = await requireEmployee(userId, email);
  const extension = file.name.split('.').pop() || 'bin';
  const objectName = `employee-documents/${employee.id}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': file.type || 'application/octet-stream',
    'x-amz-meta-originalname': sanitizeFilename(file.name),
    'x-amz-meta-uploaded-by': userId,
    'x-amz-meta-upload-date': new Date().toISOString(),
  });

  if (documentId) {
    return prisma.$transaction(async tx => {
      const rows = await tx.$queryRawUnsafe<Array<Record<string, unknown> & { version_number: number }>>(
        `UPDATE "hr_employee_documents"
         SET "file_path" = $3, "status" = 'complete', "uploaded_by_id" = $4::uuid,
             "version_number" = "version_number" + CASE WHEN "file_path" IS NULL THEN 0 ELSE 1 END,
             "file_size" = $5, "mime_type" = $6, "updated_at" = CURRENT_TIMESTAMP
         WHERE "id" = $1::uuid AND "employee_id" = $2::uuid
         RETURNING *`,
        documentId,
        employee.id,
        objectName,
        userId,
        buffer.length,
        file.type || 'application/octet-stream',
      );
      if (!rows[0]) return null;
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_document_versions"
          ("id", "document_id", "version_number", "file_path", "file_size", "mime_type",
           "uploaded_by_id", "created_at")
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::uuid, CURRENT_TIMESTAMP)
         ON CONFLICT ("document_id", "version_number") DO NOTHING`,
        randomUUID(),
        documentId,
        Number(rows[0].version_number),
        objectName,
        buffer.length,
        file.type || 'application/octet-stream',
        userId,
      );
      return rows[0];
    });
  }

  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `INSERT INTO "hr_employee_documents"
      ("id", "employee_id", "title", "type", "category", "status", "file_path",
       "uploaded_by_id", "file_size", "mime_type", "created_at", "updated_at")
     VALUES ($1::uuid, $2::uuid, $3, $4, $4, 'complete', $5, $6::uuid, $7, $8,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    randomUUID(),
    employee.id,
    title || sanitizeFilename(file.name),
    type || 'other',
    objectName,
    userId,
    buffer.length,
    file.type || 'application/octet-stream',
  );
  return rows[0];
}

export async function resolveEssFileAccess({
  userId,
  email,
  kind,
  id,
}: {
  userId: string;
  email?: string | null;
  kind: 'document' | 'payslip';
  id: string;
}) {
  const employee = await requireEmployee(userId, email);
  if (kind === 'document') {
    const rows = await prisma.$queryRawUnsafe<{ file_path: string | null; title: string }[]>(
      `SELECT file_path, title
       FROM "hr_employee_documents"
       WHERE "id" = $1::uuid AND "employee_id" = $2::uuid AND "status" <> 'archived'
       LIMIT 1`,
      id,
      employee.id,
    );
    if (!rows[0]?.file_path) return null;
    return { filePath: rows[0].file_path, fileName: rows[0].title };
  }

  const rows = await prisma.$queryRawUnsafe<{ file_path: string | null; id: string }[]>(
    `SELECT file_path, id
     FROM "hr_payslips"
     WHERE "id" = $1::uuid AND "employee_id" = $2::uuid AND "status" = 'published'
     LIMIT 1`,
    id,
    employee.id,
  );
  if (!rows[0]?.file_path) return null;
  return { filePath: rows[0].file_path, fileName: `payslip-${rows[0].id}.pdf` };
}

export async function applyTeamAction(userId: string, email: string | null | undefined, input: z.infer<typeof essTeamActionSchema>) {
  const manager = await requireEmployee(userId, email);
  const status = input.action === 'approve_leave'
    ? 'approved'
    : input.action === 'return_leave'
      ? 'returned_for_revision'
      : 'rejected';
  const result = await prisma.$transaction(async tx => {
    const current = await tx.$queryRawUnsafe<Array<{
      id: string;
      employee_id: string;
      policy_id: string | null;
      days: number;
      version: number;
      start_date: Date;
      requester_user_id: string | null;
    }>>(
      `SELECT lr.id, lr.employee_id, lr.policy_id, lr.days, lr.version, lr.start_date,
              e.user_id AS requester_user_id
       FROM "hr_leave_requests" lr
       JOIN "hr_employees" e ON e.id = lr.employee_id
       WHERE lr.id = $1::uuid AND e.manager_id = $2::uuid
         AND lr.status IN ('pending', 'submitted', 'pending_approval')
       FOR UPDATE`,
      input.id,
      manager.id,
    );
    const request = current[0];
    if (!request || (input.expectedVersion && request.version !== input.expectedVersion)) return null;

    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_leave_requests"
       SET "status" = $3, "approver_id" = $2::uuid, "approver_comments" = $4,
           "decided_at" = CURRENT_TIMESTAMP, "version" = "version" + 1,
           "updated_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1::uuid
       RETURNING *`,
      input.id,
      manager.id,
      status,
      input.comment || null,
    );
    if (request.policy_id) {
      await tx.$executeRawUnsafe(
        `UPDATE "hr_leave_balances"
         SET "pending" = GREATEST(0, "pending" - $3),
             "used" = "used" + CASE WHEN $4 = 'approved' THEN $3 ELSE 0 END,
             "updated_at" = CURRENT_TIMESTAMP
         WHERE "employee_id" = $1::uuid AND "policy_id" = $2::uuid
           AND "year" = $5`,
        request.employee_id,
        request.policy_id,
        Number(request.days),
        status,
        request.start_date.getFullYear(),
      );
    }
    return { row: rows[0] || null, requesterUserId: request.requester_user_id };
  });
  if (result?.row && result.requesterUserId) {
    await NotificationService.createNotification(result.requesterUserId, {
      type: `ess_leave_${status}`,
      title: `Leave request ${status.replace(/_/g, ' ')}`,
      message: input.comment || `Your leave request is now ${status.replace(/_/g, ' ')}.`,
      data: { href: '/ess/leave', leaveRequestId: input.id },
    }, userId).catch(() => null);
  }
  return result?.row || null;
}
