import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { calculateProbationSchedule } from '@/lib/hr/probation';
import { buildProbationDecisionMutation } from '@/lib/hr/probation-decision';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ProbationEmployeeRow {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  location: string | null;
  profilePhotoUrl: string | null;
  status: string;
  hireDate: Date;
  positionId: string | null;
  positionTitle: string | null;
  managerName: string | null;
  managerJobTitle: string | null;
  positionProbationPeriodDays: number | null;
  positionEvaluationFrequencyDays: number | null;
  probationPeriodDays: number | null;
  evaluationFrequencyDays: number | null;
}

const updateProbationSchema = z.object({
  employeeId: z.string().uuid(),
  probationPeriodDays: z.number().int().min(1).max(730).nullable().optional(),
  evaluationFrequencyDays: z.number().int().min(1).max(365).nullable().optional(),
});

const recordDecisionSchema = z.object({
  employeeId: z.string().uuid(),
  outcome: z.enum(['confirm', 'extend', 'end']),
  rationale: z.string().trim().min(20).max(300),
  effectiveDate: z.string().date(),
});

function canViewProbation(user: Parameters<typeof hasAnyPermission>[0]) {
  return hasAnyPermission(user, ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'] as PlatformModuleId[]);
}

function canManageProbation(user: Parameters<typeof hasAnyPermission>[0]) {
  return hasAnyPermission(user, ['HR_PEOPLE_MANAGE'] as PlatformModuleId[]);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!canViewProbation(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR people permission.' }, { status: 403 });
  }

  try {
    const rows = await prisma.$queryRaw<ProbationEmployeeRow[]>`
      SELECT
        employee.id,
        employee.employee_number AS "employeeNumber",
        employee.first_name AS "firstName",
        employee.last_name AS "lastName",
        employee.email,
        employee.location,
        employee.profile_photo_url AS "profilePhotoUrl",
        employee.status,
        employee.hire_date AS "hireDate",
        employee.position_id AS "positionId",
        position.title AS "positionTitle",
        NULLIF(TRIM(CONCAT_WS(' ', manager.first_name, manager.last_name)), '') AS "managerName",
        manager.job_title AS "managerJobTitle",
        position.probation_period_days AS "positionProbationPeriodDays",
        position.probation_evaluation_frequency_days AS "positionEvaluationFrequencyDays",
        employee.probation_period_days AS "probationPeriodDays",
        employee.probation_evaluation_frequency_days AS "evaluationFrequencyDays"
      FROM hr_employees employee
      LEFT JOIN "Position" position ON position.id = employee.position_id
      LEFT JOIN hr_employees manager ON manager.id = employee.manager_id
      WHERE employee.hire_date IS NOT NULL
        AND employee.status NOT IN ('inactive', 'terminated')
        AND COALESCE((
          SELECT decision_event.proposed_values->>'outcome'
          FROM hr_employment_events decision_event
          WHERE decision_event.employee_id = employee.id
            AND decision_event.event_type = 'probation_decision'
            AND decision_event.status = 'applied'
          ORDER BY decision_event.created_at DESC
          LIMIT 1
        ), '') NOT IN ('confirm', 'end')
      ORDER BY employee.hire_date DESC
    `;

    const employees = rows
      .map((row) => {
        const effectivePeriodDays = row.probationPeriodDays
          ?? row.positionProbationPeriodDays
          ?? 90;
        const effectiveFrequencyDays = row.evaluationFrequencyDays
          ?? row.positionEvaluationFrequencyDays
          ?? 30;
        const schedule = calculateProbationSchedule({
          hireDate: row.hireDate,
          probationPeriodDays: effectivePeriodDays,
          evaluationFrequencyDays: effectiveFrequencyDays,
        });
        // Keep unresolved, overdue probation records visible until HR records a
        // final decision. Hiding them after the calculated end date makes the
        // profile and review roster disagree and removes the recovery path.
        if (!schedule || (!schedule.isOnProbation && schedule.daysRemaining >= 0)) return null;

        return {
          ...row,
          effectivePeriodDays,
          effectiveFrequencyDays,
          probationStartDate: schedule.startDate.toISOString(),
          probationEndDate: schedule.endDate.toISOString(),
          nextEvaluationDate: schedule.nextEvaluationDate.toISOString(),
          evaluationNumber: schedule.evaluationNumber,
          daysRemaining: schedule.daysRemaining,
          progressPercent: schedule.progressPercent,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((left, right) => (
        new Date(left.nextEvaluationDate).getTime() - new Date(right.nextEvaluationDate).getTime()
      ));

    return NextResponse.json({
      employees,
      canManage: canManageProbation(session.user),
      summary: {
        total: employees.length,
        evaluationsDueInSevenDays: employees.filter(employee => (
          Math.ceil((new Date(employee.nextEvaluationDate).getTime() - Date.now()) / 86_400_000) <= 7
        )).length,
        endingInThirtyDays: employees.filter(employee => employee.daysRemaining <= 30).length,
      },
    });
  } catch (error) {
    console.error('[HR:Probation] Failed to load probation roster:', error);
    return NextResponse.json({ message: 'Unable to load the probation roster.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!canManageProbation(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR people permission.' }, { status: 403 });
  }

  const parsed = updateProbationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid probation configuration.', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { employeeId, probationPeriodDays, evaluationFrequencyDays } = parsed.data;
  try {
    const updated = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE hr_employees
      SET
        probation_period_days = ${probationPeriodDays ?? null},
        probation_evaluation_frequency_days = ${evaluationFrequencyDays ?? null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${employeeId}::uuid
      RETURNING id
    `;
    if (!updated[0]) {
      return NextResponse.json({ message: 'Employee not found.' }, { status: 404 });
    }

    await logAudit(
      'AUDIT',
      'Employee probation configuration updated.',
      'API:HR:Probation:Update',
      session.user.id,
      { employeeId, probationPeriodDays, evaluationFrequencyDays },
    );
    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error('[HR:Probation] Failed to update employee probation:', error);
    return NextResponse.json({ message: 'Unable to update probation configuration.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!canManageProbation(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR people permission.' }, { status: 403 });
  }

  const parsed = recordDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid probation decision.', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { employeeId, outcome, rationale, effectiveDate } = parsed.data;
  const today = new Date().toISOString().slice(0, 10);
  if (effectiveDate > today) {
    return NextResponse.json({ message: 'The probation decision cannot take effect in the future.' }, { status: 400 });
  }
  try {
    const decision = await prisma.$transaction(async (transaction) => {
      const employees = await transaction.$queryRaw<Array<{
        id: string;
        hireDate: Date | null;
        status: string;
        endDate: Date | null;
        probationPeriodDays: number | null;
      }>>`
        SELECT id, hire_date AS "hireDate", status, end_date AS "endDate",
          probation_period_days AS "probationPeriodDays"
        FROM hr_employees
        WHERE id = ${employeeId}::uuid
        FOR UPDATE
      `;
      const employee = employees[0];
      if (!employee) throw new Error('EMPLOYEE_NOT_FOUND');
      if (!employee.hireDate) throw new Error('HIRE_DATE_REQUIRED');

      const idempotencyKey = `probation-decision:${employeeId}:${effectiveDate}:${outcome}`;
      const existingEvents = await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM hr_employment_events
        WHERE idempotency_key = ${idempotencyKey}
        LIMIT 1
      `;
      if (existingEvents[0]) throw new Error('DECISION_ALREADY_RECORDED');

      const mutation = buildProbationDecisionMutation(outcome, employee.hireDate, effectiveDate);
      const previousValues = JSON.stringify({
        status: employee.status,
        endDate: employee.endDate,
        probationPeriodDays: employee.probationPeriodDays,
      });
      const proposedValues = JSON.stringify({
        outcome,
        status: mutation.employeeStatus,
        endDate: mutation.endDate,
        probationPeriodDays: mutation.probationPeriodDays,
      });

      await transaction.$executeRaw`
        UPDATE hr_employees
        SET status = ${mutation.employeeStatus},
          end_date = CASE WHEN ${outcome} = 'end' THEN ${mutation.endDate}::date ELSE end_date END,
          probation_period_days = ${mutation.probationPeriodDays},
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${employeeId}::uuid
      `;

      const events = await transaction.$queryRaw<Array<{ id: string }>>`
        INSERT INTO hr_employment_events (
          employee_id, event_type, effective_date, status, reason,
          previous_values, proposed_values, idempotency_key,
          requested_by_id, approved_by_id, approved_at, applied_at
        ) VALUES (
          ${employeeId}::uuid, 'probation_decision', ${effectiveDate}::date, 'applied', ${rationale},
          ${previousValues}::jsonb, ${proposedValues}::jsonb,
          ${idempotencyKey},
          ${session.user.id}::uuid, ${session.user.id}::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id
      `;
      return { eventId: events[0].id, ...mutation };
    });

    await logAudit(
      'AUDIT',
      `Employee probation decision recorded: ${outcome}.`,
      'API:HR:Probation:Decision',
      session.user.id,
      { employeeId, outcome, effectiveDate, eventId: decision.eventId },
    );
    return NextResponse.json({ recorded: true, decision }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'EMPLOYEE_NOT_FOUND') {
      return NextResponse.json({ message: 'Employee not found.' }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'HIRE_DATE_REQUIRED') {
      return NextResponse.json({ message: 'The employee needs a hire date before a probation decision can be recorded.' }, { status: 409 });
    }
    if (error instanceof Error && error.message === 'DECISION_ALREADY_RECORDED') {
      return NextResponse.json({ message: 'This probation decision has already been recorded.' }, { status: 409 });
    }
    if (error instanceof Error && (error.message.includes('new probation end date') || error.message.includes('effective date'))) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error('[HR:Probation] Failed to record probation decision:', error);
    return NextResponse.json({ message: 'Unable to record the probation decision.' }, { status: 500 });
  }
}
