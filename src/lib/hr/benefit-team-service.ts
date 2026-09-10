import { z } from 'zod';

import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';
import { resolveBenefitTransition, type BenefitAction } from './benefit-lifecycle';
import { getEmployeeForUser } from './ess-service';

export const benefitTeamActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approve_benefit', 'reject_benefit', 'return_benefit']),
  comment: z.string().trim().max(2000).optional().nullable(),
  expectedVersion: z.coerce.number().int().positive(),
}).refine(
  value => value.action === 'approve_benefit' || Boolean(value.comment?.trim()),
  { message: 'A comment is required when rejecting or returning a benefit request.', path: ['comment'] },
);

export type BenefitTeamActionInput = z.infer<typeof benefitTeamActionSchema>;

export function decisionFromBenefitTeamAction(action: BenefitTeamActionInput['action']): Extract<BenefitAction, 'approve' | 'reject' | 'return'> {
  if (action === 'approve_benefit') return 'approve';
  if (action === 'reject_benefit') return 'reject';
  return 'return';
}

type BenefitApprovalRow = Record<string, unknown> & {
  id: string;
  status: string;
  version: number;
  employee_id: string;
  requester_user_id: string | null;
  benefit_name: string;
};

async function requireManager(userId: string, email?: string | null) {
  const employee = await getEmployeeForUser(userId, email);
  if (!employee) throw new Error('NO_EMPLOYEE');
  return employee;
}

export async function listManagerBenefitApprovals(userId: string, email?: string | null) {
  const manager = await requireManager(userId, email);
  return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT enrollment.id,
            'benefit_enrollment' AS request_type,
            enrollment.status,
            enrollment.version,
            enrollment.employee_id,
            enrollment.effective_from,
            enrollment.effective_to,
            enrollment.life_event_type,
            enrollment.dependents,
            enrollment.employee_contribution,
            enrollment.employer_contribution,
            enrollment.evidence,
            enrollment.created_at,
            enrollment.updated_at,
            plan.name AS benefit_name,
            plan.type AS benefit_type,
            employee.first_name,
            employee.last_name,
            employee.preferred_name,
            employee.job_title
       FROM "hr_employee_benefit_enrollments" enrollment
       JOIN "hr_employees" employee ON employee.id = enrollment.employee_id
       JOIN "hr_benefit_plans" plan ON plan.id = enrollment.benefit_plan_id
      WHERE employee.manager_id = $1::uuid
        AND enrollment.status IN ('pending_approval', 'pending_termination')
      ORDER BY enrollment.updated_at ASC
      LIMIT 100`,
    manager.id,
  );
}

export async function applyManagerBenefitAction(
  userId: string,
  email: string | null | undefined,
  input: BenefitTeamActionInput,
) {
  const manager = await requireManager(userId, email);
  const decision = decisionFromBenefitTeamAction(input.action);

  const result = await prisma.$transaction(async tx => {
    const currentRows = await tx.$queryRawUnsafe<BenefitApprovalRow[]>(
      `SELECT enrollment.id, enrollment.status, enrollment.version, enrollment.employee_id,
              employee.user_id AS requester_user_id, plan.name AS benefit_name
         FROM "hr_employee_benefit_enrollments" enrollment
         JOIN "hr_employees" employee ON employee.id = enrollment.employee_id
         JOIN "hr_benefit_plans" plan ON plan.id = enrollment.benefit_plan_id
        WHERE enrollment.id = $1::uuid AND employee.manager_id = $2::uuid
        LIMIT 1
        FOR UPDATE`,
      input.id,
      manager.id,
    );
    const current = currentRows[0];
    if (!current) return null;
    if (Number(current.version) !== input.expectedVersion) throw new Error('STALE_BENEFIT');

    const nextStatus = resolveBenefitTransition(current.status, decision, 'manager');
    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_employee_benefit_enrollments"
          SET status = $2,
              ended_at = CASE WHEN $2 = 'ended' THEN CURRENT_TIMESTAMP ELSE ended_at END,
              effective_to = CASE WHEN $2 = 'ended' THEN CURRENT_DATE ELSE effective_to END,
              evidence = COALESCE(evidence, '[]'::jsonb) || jsonb_build_array(
                jsonb_build_object(
                  'kind', 'decision',
                  'action', $3,
                  'comment', $4,
                  'fromStatus', $5,
                  'toStatus', $2,
                  'actorUserId', $6,
                  'createdAt', CURRENT_TIMESTAMP
                )
              ),
              version = version + 1,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid AND version = $7
        RETURNING *`,
      current.id,
      nextStatus,
      decision,
      input.comment || null,
      current.status,
      userId,
      input.expectedVersion,
    );
    if (!rows[0]) throw new Error('STALE_BENEFIT');
    return { row: rows[0], current, nextStatus };
  });

  if (!result) return null;
  if (result.current.requester_user_id) {
    const verb = result.nextStatus === 'active'
      ? 'approved'
      : result.nextStatus === 'ended'
        ? 'ended'
        : result.nextStatus === 'rejected'
          ? 'rejected'
          : result.nextStatus === 'returned_for_revision'
            ? 'returned for revision'
            : 'updated';
    await NotificationService.createNotification(result.current.requester_user_id, {
      type: 'ess_request_updated',
      title: 'Benefit request updated',
      message: `${result.current.benefit_name} was ${verb}.${input.comment ? ` ${input.comment}` : ''}`,
      data: { href: '/ess/benefits', enrollmentId: result.current.id, requestType: 'benefit_enrollment' },
    }, userId).catch(() => null);
  }
  return result.row;
}
