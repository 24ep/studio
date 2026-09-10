import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';

import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';
import {
  calculateProfileCompletion,
  createHumanRequestId,
  type EssRequestType,
} from './ess-contracts';
import { getEmployeeForUser } from './ess-service';
import { calculateAttendance } from './attendance-calculation';
import { mergeAttendanceCorrection } from './attendance-correction';

type QueryClient = Prisma.TransactionClient | typeof prisma;

type EmployeeAccessRow = {
  id: string;
  user_id: string | null;
  manager_id: string | null;
  company_id: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
};

type CreateRequestInput = {
  requestType: EssRequestType;
  title: string;
  reason: string;
  values: Record<string, unknown>;
  originalValues: Record<string, unknown>;
  saveAsDraft: boolean;
  supportingDocuments?: Array<{ name: string; url: string; size?: string }>;
};

type RequestRow = Record<string, unknown> & {
  id: string;
  request_id: string;
  request_type: EssRequestType;
  requester_employee_id: string;
  status: string;
  current_approver_user_id: string | null;
  version: number;
  company_id: string | null;
};

function requestPrefix(type: EssRequestType) {
  return {
    profile_change: 'PCR',
    attendance_correction: 'ACR',
    document_request: 'DCR',
    performance_submission: 'PER',
  }[type];
}

async function requireEmployeeAccess(userId: string, email?: string | null) {
  const employee = await getEmployeeForUser(userId, email);
  if (!employee) throw new Error('NO_EMPLOYEE');
  return employee as unknown as EmployeeAccessRow;
}

async function getManagerUserId(client: QueryClient, managerEmployeeId: string | null) {
  if (!managerEmployeeId) return null;
  const rows = await client.$queryRawUnsafe<{ user_id: string | null }[]>(
    `SELECT "user_id" FROM "hr_employees" WHERE "id" = $1::uuid LIMIT 1`,
    managerEmployeeId,
  );
  return rows[0]?.user_id || null;
}

async function addActivity(
  client: QueryClient,
  requestId: string,
  actorUserId: string,
  action: string,
  fromStatus: string | null,
  toStatus: string,
  comment?: string | null,
) {
  await client.$executeRawUnsafe(
    `INSERT INTO "hr_ess_request_activities"
       ("id", "request_id", "actor_user_id", "action", "from_status", "to_status",
        "comment", "created_at")
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
    randomUUID(),
    requestId,
    actorUserId,
    action,
    fromStatus,
    toStatus,
    comment || null,
  );
}

export async function listOwnEssRequests(userId: string, email?: string | null) {
  const employee = await requireEmployeeAccess(userId, email);
  return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT r.*,
       COALESCE(
         jsonb_agg(
           jsonb_build_object(
             'id', a.id,
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
    employee.id,
  );
}

export async function listManagerEssApprovals(userId: string, email?: string | null) {
  const manager = await requireEmployeeAccess(userId, email);
  const [requests, leaveRequests] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT r.*, e.first_name, e.last_name, e.preferred_name, e.job_title,
              s.step_number, s.approver_type
       FROM "hr_ess_requests" r
       JOIN "hr_ess_approval_steps" s ON s.request_id = r.id
       JOIN "hr_employees" e ON e.id = r.requester_employee_id
       WHERE s.approver_user_id = $1::uuid
         AND s.status = 'pending'
         AND r.status = 'pending_approval'
       ORDER BY r.submitted_at ASC NULLS LAST
       LIMIT 100`,
      userId,
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT lr.id, lr.request_id, 'leave_request' AS request_type,
              lr.status, lr.version, lr.start_date, lr.end_date, lr.days,
              lr.reason, lr.request_unit, lr.requested_hours, lr.attachments,
              lr.created_at, lr.submitted_at,
              e.first_name, e.last_name, e.preferred_name, e.job_title
       FROM "hr_leave_requests" lr
       JOIN "hr_employees" e ON e.id = lr.employee_id
       WHERE e.manager_id = $1::uuid AND lr.status IN ('submitted', 'pending', 'pending_approval')
       ORDER BY lr.submitted_at ASC NULLS LAST, lr.created_at ASC
       LIMIT 100`,
      manager.id,
    ),
  ]);
  return [...requests, ...leaveRequests];
}

export async function createEssRequest(
  userId: string,
  email: string | null | undefined,
  input: CreateRequestInput,
) {
  const employee = await requireEmployeeAccess(userId, email);
  const managerUserId = await getManagerUserId(prisma, employee.manager_id);
  const id = randomUUID();
  const status = input.saveAsDraft ? 'draft' : managerUserId ? 'pending_approval' : 'processing';
  const requestId = createHumanRequestId(requestPrefix(input.requestType), id);

  const row = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<RequestRow[]>(
      `INSERT INTO "hr_ess_requests"
        ("id", "request_id", "request_type", "requester_employee_id", "subject_employee_id",
         "company_id", "status", "current_step", "current_approver_user_id", "title", "reason",
         "original_values", "requested_values", "supporting_documents", "submitted_at", "due_at",
         "created_at", "updated_at")
       VALUES
        ($1::uuid, $2, $3, $4::uuid, $4::uuid, $5::uuid, $6, $7, $8::uuid, $9, $10,
         $11::jsonb, $12::jsonb, $13::jsonb,
         CASE WHEN $6 = 'draft' THEN NULL ELSE CURRENT_TIMESTAMP END,
         CASE WHEN $6 = 'draft' THEN NULL ELSE CURRENT_TIMESTAMP + INTERVAL '5 days' END,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      id,
      requestId,
      input.requestType,
      employee.id,
      employee.company_id,
      status,
      managerUserId ? 1 : 0,
      managerUserId,
      input.title,
      input.reason,
      JSON.stringify(input.originalValues),
      JSON.stringify(input.values),
      JSON.stringify(input.supportingDocuments || []),
    );
    if (managerUserId) {
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_ess_approval_steps"
          ("id", "request_id", "step_number", "approver_type", "approver_user_id", "status",
           "created_at", "updated_at")
         VALUES ($1::uuid, $2::uuid, 1, 'manager', $3::uuid, 'pending',
                 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        randomUUID(),
        id,
        managerUserId,
      );
    }
    await addActivity(tx, id, userId, input.saveAsDraft ? 'draft_saved' : 'submitted', null, status);
    return rows[0];
  });

  if (managerUserId && !input.saveAsDraft) {
    await NotificationService.createNotification(managerUserId, {
      type: 'ess_approval_required',
      title: 'Employee request needs your review',
      message: `${input.title} is awaiting your decision.`,
      data: { href: '/ess/team', requestId: id, requestType: input.requestType },
    }, userId).catch(() => null);
  }
  return row;
}

async function applyApprovedRequest(
  client: QueryClient,
  request: RequestRow & { requested_values?: unknown },
  actorUserId: string,
) {
  const values = (request.requested_values || {}) as Record<string, unknown>;

  if (request.request_type === 'profile_change') {
    const scalarColumns: Record<string, string> = {
      preferredName: 'preferred_name',
      phone: 'phone',
      location: 'location',
    };
    for (const [field, column] of Object.entries(scalarColumns)) {
      if (values[field] !== undefined) {
        await client.$executeRawUnsafe(
          `UPDATE "hr_employees" SET "${column}" = $2, "version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid`,
          request.requester_employee_id,
          String(values[field] ?? ''),
        );
      }
    }
    const jsonColumns: Record<string, string> = {
      address: 'address',
      emergencyContacts: 'emergency_contacts',
      familyDependents: 'family_dependents',
      education: 'education',
      workExperience: 'work_experience',
      skills: 'skills',
      certifications: 'certifications',
      languages: 'languages',
      bankInformation: 'bank_information',
      taxInformation: 'tax_information',
      governmentIdentification: 'government_identification',
    };
    for (const [field, column] of Object.entries(jsonColumns)) {
      if (values[field] !== undefined) {
        await client.$executeRawUnsafe(
          `UPDATE "hr_employees" SET "${column}" = $2::jsonb, "version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid`,
          request.requester_employee_id,
          JSON.stringify(values[field]),
        );
      }
    }
    const completionRows = await client.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT employee_number AS "employeeNumber", employee.first_name AS "firstName",
              employee.last_name AS "lastName", employee.preferred_name AS "preferredName",
              legal_name AS "legalName", employee.email, employee.phone, employee.location,
              person.email AS "personalEmail", person.phone AS "personalPhone",
              person.location AS "personalLocation", person.introduction,
              job_title AS "jobTitle", employment_type AS "employmentType", employee.status,
              hire_date AS "hireDate", department_id AS "departmentId", manager_id AS "managerId",
              position_id AS "positionId", company_id AS "companyId", client_id AS "clientId",
              end_date AS "endDate", probation_period_days AS "probationPeriodDays",
              probation_evaluation_frequency_days AS "probationEvaluationFrequencyDays",
              business_unit AS "businessUnit", work_phone AS "workPhone",
              profile_photo_url AS "profilePhotoUrl", personal_information AS "personalInformation",
              address, emergency_contacts AS "emergencyContacts",
              family_dependents AS "familyDependents", bank_information AS "bankInformation",
              tax_information AS "taxInformation",
              government_identification AS "governmentIdentification", employee.education,
              employee.work_experience AS "workExperience", employee.skills,
              certifications, languages
       FROM "hr_employees" employee
       LEFT JOIN "person_profiles" person ON person.id = employee.person_profile_id
       WHERE employee.id = $1::uuid`,
      request.requester_employee_id,
    );
    if (completionRows[0]) {
      await client.$executeRawUnsafe(
        `UPDATE "hr_employees"
         SET "profile_completion" = $2, "updated_at" = CURRENT_TIMESTAMP
         WHERE id = $1::uuid`,
        request.requester_employee_id,
        calculateProfileCompletion(completionRows[0]),
      );
    }
  }

  if (request.request_type === 'attendance_correction') {
    const requested = values as Record<string, unknown>;
    const workDate = String(requested.workDate || '');
    const correctionType = String(requested.correctionType || '');
    const currentRows = await client.$queryRawUnsafe<Array<{
      id: string;
      clock_in: Date | null;
      clock_out: Date | null;
      break_minutes: number | null;
      work_location: string | null;
      status: string | null;
      assignment_id: string | null;
    }>>(
      `SELECT id, clock_in, clock_out, break_minutes, work_location, status, assignment_id
       FROM "hr_attendance_records"
       WHERE employee_id = $1::uuid AND work_date::date = $2::date
         AND ($3::uuid IS NULL OR id = $3::uuid)
       LIMIT 1 FOR UPDATE`,
      request.requester_employee_id,
      workDate,
      requested.attendanceRecordId || null,
    );
    const current = currentRows[0] || null;

    if (correctionType === 'incorrect_shift_assignment') {
      const replacementId = requested.assignmentId ? String(requested.assignmentId) : '';
      const replacement = await client.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "hr_shift_assignments"
         WHERE id = $1::uuid AND employee_id = $2::uuid
           AND shift_date::date = $3::date AND status <> 'cancelled'
         LIMIT 1`,
        replacementId,
        request.requester_employee_id,
        workDate,
      );
      if (!replacement[0]) throw new Error('FORBIDDEN');
    }

    const merged = mergeAttendanceCorrection({
      clockIn: current?.clock_in ? current.clock_in.toISOString() : null,
      clockOut: current?.clock_out ? current.clock_out.toISOString() : null,
      breakMinutes: Number(current?.break_minutes || 0),
      workLocation: current?.work_location || null,
      status: current?.status || null,
      assignmentId: current?.assignment_id || null,
    }, {
      correctionType: correctionType as Parameters<typeof mergeAttendanceCorrection>[1]['correctionType'],
      clockIn: requested.clockIn == null ? undefined : String(requested.clockIn),
      clockOut: requested.clockOut == null ? undefined : String(requested.clockOut),
      breakMinutes: requested.breakMinutes == null ? undefined : Number(requested.breakMinutes),
      workLocation: requested.workLocation == null ? undefined : String(requested.workLocation),
      requestedStatus: requested.requestedStatus == null ? undefined : String(requested.requestedStatus),
      assignmentId: requested.assignmentId == null ? undefined : String(requested.assignmentId),
    });

    const corrected = await client.$queryRawUnsafe<Array<{ id: string }>>(
      `INSERT INTO "hr_attendance_records"
        ("id", "employee_id", "assignment_id", "work_date", "clock_in", "clock_out", "break_minutes",
         "hours_worked", "status", "work_location", "source", "created_at", "updated_at")
       VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4::date, $5::timestamptz, $6::timestamptz, $7,
         CASE WHEN $5::timestamptz IS NULL OR $6::timestamptz IS NULL THEN 0
           ELSE GREATEST(0, EXTRACT(EPOCH FROM ($6::timestamptz - $5::timestamptz)) / 3600 - ($7::numeric / 60))
         END,
         COALESCE($8, 'present'), $9, 'employee_correction', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )
       ON CONFLICT ("employee_id", "work_date")
       DO UPDATE SET
         "assignment_id" = EXCLUDED."assignment_id",
         "clock_in" = EXCLUDED."clock_in",
         "clock_out" = EXCLUDED."clock_out",
         "break_minutes" = EXCLUDED."break_minutes",
         "hours_worked" = EXCLUDED."hours_worked",
         "status" = EXCLUDED."status",
         "work_location" = EXCLUDED."work_location",
         "source" = 'employee_correction',
         "version" = "hr_attendance_records"."version" + 1,
         "updated_at" = CURRENT_TIMESTAMP
       RETURNING id`,
      current?.id || randomUUID(),
      request.requester_employee_id,
      merged.assignmentId,
      workDate,
      merged.clockIn,
      merged.clockOut,
      merged.breakMinutes,
      merged.status,
      merged.workLocation,
    );
    const attendanceId = corrected[0]?.id;
    if (attendanceId) {
      const context = await client.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT ar.*, sa.start_at AS scheduled_start, sa.end_at AS scheduled_end,
                COALESCE(sdv.grace_period_minutes, 5) AS late_tolerance,
                COALESCE(sdv.early_departure_tolerance_minutes, 5) AS early_tolerance,
                EXISTS (SELECT 1 FROM "hr_leave_requests" lr WHERE lr.employee_id = ar.employee_id
                  AND lr.status = 'approved' AND ar.work_date::date BETWEEN lr.start_date::date AND lr.end_date::date) AS approved_leave,
                EXISTS (SELECT 1 FROM "hr_holidays" h WHERE h.holiday_date::date = ar.work_date::date
                  AND (h.location IS NULL OR h.location = ar.work_location)) AS public_holiday
         FROM "hr_attendance_records" ar
         LEFT JOIN "hr_shift_assignments" sa ON sa.id = ar.assignment_id
         LEFT JOIN "hr_shift_definition_versions" sdv ON sdv.shift_definition_id = sa.shift_definition_id
           AND sdv.version = sa.shift_definition_version
         WHERE ar.id = $1::uuid`,
        attendanceId,
      );
      const row = context[0];
      if (row) {
        const result = calculateAttendance({
          logicalDate: String(row.work_date),
          scheduledStart: row.scheduled_start ? new Date(String(row.scheduled_start)) : null,
          scheduledEnd: row.scheduled_end ? new Date(String(row.scheduled_end)) : null,
          clockIn: row.clock_in ? new Date(String(row.clock_in)) : null,
          clockOut: row.clock_out ? new Date(String(row.clock_out)) : null,
          breakMinutes: Number(row.break_minutes || 0),
          approvedLeave: Boolean(row.approved_leave),
          publicHoliday: Boolean(row.public_holiday),
          lateToleranceMinutes: Number(row.late_tolerance || 5),
          earlyDepartureToleranceMinutes: Number(row.early_tolerance || 5),
          roundingMinutes: 1,
          approvedOvertimeMinutes: Number(row.approved_overtime_minutes || 0),
          workLocation: row.work_location ? String(row.work_location) : null,
        });
        const semanticStatus = ['incorrect_attendance_status', 'work_from_home_correction', 'off_site_work_correction'].includes(correctionType)
          ? merged.status || result.status
          : result.status;
        await client.$executeRawUnsafe(
          `UPDATE "hr_attendance_records" SET status = $2, scheduled_minutes = $3, worked_minutes = $4,
             regular_minutes = $5, overtime_minutes = $6, late_minutes = $7, early_departure_minutes = $8,
             paid_break_minutes = $9, unpaid_break_minutes = $10, holiday_minutes = $11,
             exception_status = CASE WHEN cardinality($12::text[]) > 0 THEN 'open' ELSE 'clear' END,
             calculation_version = $13, updated_at = CURRENT_TIMESTAMP WHERE id = $1::uuid`,
          attendanceId, semanticStatus, result.scheduledMinutes, result.workedMinutes, result.regularMinutes,
          result.overtimeMinutes, result.lateMinutes, result.earlyDepartureMinutes, result.paidBreakMinutes,
          result.unpaidBreakMinutes, result.holidayMinutes, result.exceptionCodes, result.calculationVersion,
        );
        await client.$executeRawUnsafe(
          `UPDATE "hr_attendance_calculations" SET is_current = FALSE
           WHERE attendance_record_id = $1::uuid AND is_current = TRUE`,
          attendanceId,
        );
        await client.$executeRawUnsafe(
          `INSERT INTO "hr_attendance_calculations"
            (id, attendance_record_id, calculation_version, input_snapshot, output_snapshot,
             explanation, is_current, calculated_by_id, calculated_at)
           VALUES ($1::uuid, $2::uuid, $3, $4::jsonb, $5::jsonb, $6::jsonb,
                   TRUE, $7::uuid, CURRENT_TIMESTAMP)`,
          randomUUID(), attendanceId, result.calculationVersion,
          JSON.stringify({
            logicalDate: String(row.work_date), scheduledStart: row.scheduled_start || null,
            scheduledEnd: row.scheduled_end || null, clockIn: merged.clockIn, clockOut: merged.clockOut,
            breakMinutes: merged.breakMinutes, workLocation: merged.workLocation,
            assignmentId: merged.assignmentId, correctionType,
            approvedLeave: Boolean(row.approved_leave), publicHoliday: Boolean(row.public_holiday),
          }),
          JSON.stringify({ ...result, status: semanticStatus }), JSON.stringify(result.reasons), actorUserId,
        );
        await client.$executeRawUnsafe(
          `DELETE FROM "hr_attendance_exceptions" WHERE attendance_record_id = $1::uuid AND status = 'open'`,
          attendanceId,
        );
        for (const code of result.exceptionCodes) {
          await client.$executeRawUnsafe(
            `INSERT INTO "hr_attendance_exceptions"
              (id, attendance_record_id, code, severity, status, explanation, created_at, updated_at)
             VALUES ($1::uuid, $2::uuid, $3, $4, 'open', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            randomUUID(), attendanceId, code,
            code.startsWith('MISSING_') ? 'blocked' : 'warning',
            result.reasons.join(' ') || `Attendance calculation raised ${code}.`,
          );
        }
        await client.$executeRawUnsafe(
          `INSERT INTO "hr_attendance_events"
            (id, attendance_record_id, employee_id, event_type, occurred_at,
             logical_shift_date, source, idempotency_key, metadata, actor_user_id, created_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, 'correction_applied', CURRENT_TIMESTAMP,
                   $4::date, 'employee_correction', $5, $6::jsonb, $7::uuid, CURRENT_TIMESTAMP)
           ON CONFLICT (employee_id, idempotency_key) DO NOTHING`,
          randomUUID(), attendanceId, request.requester_employee_id, workDate,
          `ess-correction:${request.id}:${request.version}`,
          JSON.stringify({ requestId: request.id, requestNumber: request.request_id, correctedValues: requested, mergedValues: merged }),
          actorUserId,
        );
      }
    }
  }
}

export async function actOnEssRequest({
  userId,
  email,
  id,
  action,
  comment,
  expectedVersion,
  privileged = false,
}: {
  userId: string;
  email?: string | null;
  id: string;
  action: 'submit' | 'withdraw' | 'cancel' | 'resubmit' | 'approve' | 'reject' | 'return_for_revision';
  comment?: string | null;
  expectedVersion: number;
  privileged?: boolean;
}) {
  const employee = await requireEmployeeAccess(userId, email);
  const result = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Array<RequestRow & { requested_values?: unknown; requester_user_id?: string | null }>>(
      `SELECT r.*, e.user_id AS requester_user_id
       FROM "hr_ess_requests" r
       JOIN "hr_employees" e ON e.id = r.requester_employee_id
       WHERE r.id = $1::uuid
       FOR UPDATE`,
      id,
    );
    const request = rows[0];
    if (!request) throw new Error('NOT_FOUND');
    if (request.version !== expectedVersion) throw new Error('CONFLICT');

    const isOwner = request.requester_employee_id === employee.id;
    const isApprover = request.current_approver_user_id === userId || privileged;
    if (request.company_id && employee.company_id && request.company_id !== employee.company_id) throw new Error('FORBIDDEN');
    const ownerActions = ['submit', 'withdraw', 'cancel', 'resubmit'];
    if (ownerActions.includes(action) && !isOwner) throw new Error('FORBIDDEN');
    if (!ownerActions.includes(action) && !isApprover) throw new Error('FORBIDDEN');

    const transitions: Record<string, { from: string[]; to: string }> = {
      submit: { from: ['draft'], to: request.current_approver_user_id ? 'pending_approval' : 'processing' },
      withdraw: { from: ['submitted', 'pending_approval', 'returned_for_revision'], to: 'withdrawn' },
      cancel: { from: ['approved', 'processing'], to: 'cancelled' },
      resubmit: { from: ['returned_for_revision', 'withdrawn'], to: request.current_approver_user_id ? 'pending_approval' : 'processing' },
      approve: { from: ['pending_approval'], to: request.request_type === 'document_request' ? 'processing' : 'approved' },
      reject: { from: ['pending_approval'], to: 'rejected' },
      return_for_revision: { from: ['pending_approval'], to: 'returned_for_revision' },
    };
    const transition = transitions[action];
    if (!transition.from.includes(request.status)) throw new Error('INVALID_TRANSITION');
    if (['reject', 'return_for_revision'].includes(action) && !comment?.trim()) throw new Error('COMMENT_REQUIRED');

    if (action === 'approve') await applyApprovedRequest(tx, request, userId);
    const updated = await tx.$queryRawUnsafe<RequestRow[]>(
      `UPDATE "hr_ess_requests"
       SET "status" = $2,
           "version" = "version" + 1,
           "submitted_at" = CASE WHEN $3 IN ('submit', 'resubmit') THEN CURRENT_TIMESTAMP ELSE "submitted_at" END,
           "withdrawn_at" = CASE WHEN $3 = 'withdraw' THEN CURRENT_TIMESTAMP ELSE "withdrawn_at" END,
           "completed_at" = CASE WHEN $2 IN ('approved', 'rejected', 'cancelled', 'completed') THEN CURRENT_TIMESTAMP ELSE "completed_at" END,
           "updated_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1::uuid
       RETURNING *`,
      id,
      transition.to,
      action,
    );
    await tx.$executeRawUnsafe(
      `UPDATE "hr_ess_approval_steps"
       SET "status" = CASE
         WHEN $2 = 'approve' THEN 'approved'
         WHEN $2 = 'reject' THEN 'rejected'
         WHEN $2 = 'return_for_revision' THEN 'returned_for_revision'
         WHEN $2 IN ('submit', 'resubmit') THEN 'pending'
         ELSE "status" END,
         "comments" = COALESCE($3, "comments"),
         "acted_at" = CASE WHEN $2 IN ('approve', 'reject', 'return_for_revision') THEN CURRENT_TIMESTAMP ELSE "acted_at" END,
         "updated_at" = CURRENT_TIMESTAMP
       WHERE "request_id" = $1::uuid AND "step_number" = 1`,
      id,
      action,
      comment || null,
    );
    await addActivity(tx, id, userId, action, request.status, transition.to, comment);
    return { row: updated[0], requesterUserId: request.requester_user_id };
  });

  if (result.requesterUserId && result.requesterUserId !== userId) {
    await NotificationService.createNotification(result.requesterUserId, {
      type: `ess_request_${action}`,
      title: `Request ${action.replace(/_/g, ' ')}`,
      message: `${result.row.request_id} is now ${String(result.row.status).replace(/_/g, ' ')}.`,
      data: { href: requestHref(result.row.request_type), requestId: result.row.id },
    }, userId).catch(() => null);
  }
  return result.row;
}

function requestHref(type: EssRequestType) {
  if (type === 'profile_change') return '/ess/profile';
  if (type === 'attendance_correction') return '/ess/attendance';
  if (type === 'document_request') return '/ess/documents';
  return '/ess/performance';
}
