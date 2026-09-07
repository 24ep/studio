import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import { getPayrollAccess } from '@/lib/payroll/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

interface TimelineRow {
  id: string;
  module: string;
  title: string;
  status: string;
  occurredAt: Date;
  details: Record<string, unknown>;
}

const timelineModules = ['Timeline', 'Onboarding', 'Leave', 'Attendance', 'Learning', 'Performance', 'Payroll'] as const;
type TimelineModule = (typeof timelineModules)[number];

export async function GET(request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'User session required.' } }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: { code: 'INVALID_ID', message: 'Valid employee id required.' } }, { status: 400 });
  }

  const hasPeopleAccess = hasAnyPermission(session.user, ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE']);
  let ownEmployeeId: string | null = null;
  if (!hasPeopleAccess) {
    const ownEmployee = await getEmployeeForUser(session.user.id, session.user.email);
    ownEmployeeId = ownEmployee?.id || null;
    if (ownEmployeeId !== id) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'HR people permission required.' } }, { status: 403 });
    }
  }

  const requestedModule = new URL(request.url).searchParams.get('module');
  if (!timelineModules.includes(requestedModule as TimelineModule)) {
    return NextResponse.json({ error: { code: 'INVALID_MODULE', message: 'Valid employee module required.' } }, { status: 400 });
  }

  try {
    let rows: TimelineRow[];
    switch (requestedModule as TimelineModule) {
      case 'Timeline':
        rows = await prisma.$queryRaw<TimelineRow[]>`
          SELECT employee.id,
            'Timeline' AS module,
            'Joined company' AS title,
            employee.status,
            COALESCE(employee.hire_date, employee.created_at) AS "occurredAt",
            jsonb_build_object(
              'kind', 'hire',
              'employeeNumber', employee.employee_number,
              'jobTitle', employee.job_title,
              'employmentType', employee.employment_type,
              'location', employee.location
            ) AS details
          FROM hr_employees employee
          WHERE employee.id = ${id}::uuid

          UNION ALL

          SELECT event.id,
            'Timeline' AS module,
            initcap(replace(event.event_type, '_', ' ')) AS title,
            event.status,
            event.effective_date::timestamptz AS "occurredAt",
            jsonb_build_object(
              'kind', 'employment_event',
              'reason', event.reason,
              'previousValues', event.previous_values,
              'proposedValues', event.proposed_values,
              'requestId', event.request_id,
              'approvedAt', event.approved_at,
              'appliedAt', event.applied_at
            ) AS details
          FROM hr_employment_events event
          WHERE event.employee_id = ${id}::uuid

          UNION ALL

          SELECT request.id,
            'Timeline' AS module,
            'Profile change · ' || initcap(replace(request.field, '_', ' ')) AS title,
            request.status,
            COALESCE(request.submitted_at, request.created_at) AS "occurredAt",
            jsonb_build_object(
              'kind', 'profile_change',
              'field', request.field,
              'currentValue', request.current_value,
              'requestedValue', request.requested_value,
              'originalValues', request.original_values,
              'requestedValues', request.requested_values,
              'reason', request.reason,
              'requestId', request.request_id,
              'decidedAt', request.decided_at
            ) AS details
          FROM hr_employee_profile_change_requests request
          WHERE request.employee_id = ${id}::uuid

          UNION ALL

          SELECT document.id,
            'Timeline' AS module,
            document.title,
            document.status,
            document.created_at AS "occurredAt",
            jsonb_build_object(
              'kind', 'document',
              'type', document.type,
              'category', document.category,
              'issueDate', document.issue_date,
              'expiresAt', document.expires_at,
              'acknowledgedAt', document.acknowledged_at,
              'version', document.version_number
            ) AS details
          FROM hr_employee_documents document
          WHERE document.employee_id = ${id}::uuid

          ORDER BY "occurredAt" DESC
          LIMIT 250`;
        break;
      case 'Onboarding':
        rows = await prisma.$queryRaw<TimelineRow[]>`
          SELECT onboarding.id, 'Onboarding' AS module, COALESCE(template.name, 'Employee onboarding') AS title,
            onboarding.status, COALESCE(onboarding.start_date, onboarding.created_at) AS "occurredAt",
        jsonb_build_object('completedAt', onboarding.completed_at) AS details FROM hr_employee_onboarding onboarding
        LEFT JOIN hr_onboarding_templates template ON template.id = onboarding.template_id
        WHERE onboarding.employee_id = ${id}::uuid
          ORDER BY "occurredAt" DESC LIMIT 250`;
        break;
      case 'Leave':
        rows = await prisma.$queryRaw<TimelineRow[]>`
          SELECT request.id, 'Leave' AS module, COALESCE(policy.name, 'Leave request') AS title,
            request.status, request.created_at AS "occurredAt",
        jsonb_build_object('startDate', request.start_date, 'endDate', request.end_date, 'units', request.days,
          'policyId', request.policy_id, 'policyVersion', request.policy_version, 'reason', request.reason,
          'decidedAt', request.decided_at) AS details FROM hr_leave_requests request
        LEFT JOIN hr_leave_policies policy ON policy.id = request.policy_id
        WHERE request.employee_id = ${id}::uuid
          ORDER BY "occurredAt" DESC LIMIT 250`;
        break;
      case 'Attendance':
        rows = await prisma.$queryRaw<TimelineRow[]>`
          SELECT attendance.id, 'Attendance' AS module, 'Attendance record' AS title,
            attendance.status, attendance.work_date AS "occurredAt",
        jsonb_build_object('checkIn', attendance.clock_in, 'checkOut', attendance.clock_out,
          'scheduleName', schedule.name, 'workLocation', attendance.work_location,
          'lateMinutes', attendance.late_minutes, 'overtimeHours', attendance.overtime_hours) AS details
        FROM hr_attendance_records attendance
        LEFT JOIN hr_shift_assignments assignment ON assignment.id = attendance.assignment_id
        LEFT JOIN hr_work_schedules schedule ON schedule.id = assignment.schedule_id
        WHERE attendance.employee_id = ${id}::uuid
          ORDER BY "occurredAt" DESC LIMIT 250`;
        break;
      case 'Learning':
        rows = await prisma.$queryRaw<TimelineRow[]>`
          SELECT enrollment.id, 'Learning' AS module, course.title, enrollment.status,
            enrollment.created_at AS "occurredAt",
        jsonb_build_object('progress', enrollment.progress, 'completedAt', enrollment.completed_at,
          'dueDate', enrollment.due_date, 'startedAt', enrollment.started_at, 'courseId', enrollment.course_id) AS details FROM hr_learning_enrollments enrollment
        JOIN hr_learning_courses course ON course.id = enrollment.course_id
        WHERE enrollment.employee_id = ${id}::uuid
          ORDER BY "occurredAt" DESC LIMIT 250`;
        break;
      case 'Performance':
        rows = await prisma.$queryRaw<TimelineRow[]>`
          SELECT review.id, 'Performance' AS module, cycle.name AS title, review.status,
            review.created_at AS "occurredAt", jsonb_build_object('overallRating', review.rating,
              'cycleId', review.cycle_id, 'submittedAt', review.submitted_at,
              'releasedAt', review.released_at, 'acknowledgmentStatus', review.acknowledgment_status) AS details
        FROM hr_performance_reviews review
        JOIN hr_performance_cycles cycle ON cycle.id = review.cycle_id
        WHERE review.employee_id = ${id}::uuid
          ORDER BY "occurredAt" DESC LIMIT 250`;
        break;
      case 'Payroll': {
        const payrollAccess = await getPayrollAccess(session.user);
        if (!payrollAccess.canView) {
          if (ownEmployeeId !== id) {
            return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Payroll view permission required.' } }, { status: 403 });
          }
          // Self-service never exposes in-progress payroll run items. Employees
          // only see statements after Payroll has explicitly released them.
          rows = await prisma.$queryRaw<TimelineRow[]>`
            SELECT payslip.id, 'Payroll' AS module, COALESCE(period.name, 'Payslip') AS title,
              payslip.status, COALESCE(payslip.published_at, payslip.created_at) AS "occurredAt",
              jsonb_build_object(
                'grossPay', payslip.gross_pay,
                'totalDeductions', payslip.total_deductions,
                'netPay', payslip.net_pay,
                'payslipId', payslip.id,
                'released', true
              ) AS details
            FROM hr_payslips payslip
            LEFT JOIN hr_payroll_periods period ON period.id = payslip.payroll_period_id
            WHERE payslip.employee_id = ${id}::uuid
              AND payslip.status = 'released'
            ORDER BY "occurredAt" DESC
            LIMIT 250`;
          break;
        }

        rows = await prisma.$queryRaw<TimelineRow[]>`
          SELECT item.id, 'Payroll' AS module, period.name AS title, item.status,
            item.created_at AS "occurredAt",
            jsonb_build_object(
              'grossPay', CASE WHEN ${payrollAccess.canViewAmounts}::boolean THEN item.gross_pay ELSE NULL END,
              'netPay', CASE WHEN ${payrollAccess.canViewAmounts}::boolean THEN item.net_pay ELSE NULL END,
              'payrollRunId', item.payroll_run_id,
              'baseSalary', CASE WHEN ${payrollAccess.canViewAmounts}::boolean THEN item.base_salary ELSE NULL END,
              'totalDeductions', CASE WHEN ${payrollAccess.canViewAmounts}::boolean THEN item.total_deductions ELSE NULL END,
              'variancePercent', item.variance_percent,
              'amountVisibility', CASE WHEN ${payrollAccess.canViewAmounts}::boolean THEN 'visible' ELSE 'restricted' END
            ) AS details
          FROM hr_payroll_run_items item
          JOIN hr_payroll_runs run ON run.id = item.payroll_run_id
          JOIN hr_payroll_periods period ON period.id = run.period_id
          WHERE item.employee_id = ${id}::uuid
            AND (${payrollAccess.actorCompanyId}::uuid IS NULL OR run.company_id = ${payrollAccess.actorCompanyId}::uuid)
          ORDER BY "occurredAt" DESC LIMIT 250`;
        break;
      }
    }
    return NextResponse.json({ data: rows });
  } catch (cause) {
    console.error('[HRIS timeline] Load failed', cause);
    return NextResponse.json({
      error: { code: 'TIMELINE_UNAVAILABLE', message: 'Apply the HRIS foundation migration to enable the employee timeline.' },
    }, { status: 503 });
  }
}
