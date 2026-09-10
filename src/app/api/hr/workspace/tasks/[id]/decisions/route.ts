import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { executeHrWorkflowAction } from '@/lib/hr/hr-workflows';
import { completeHrisTaskDecision, getHrisTaskForDecision } from '@/lib/hris/task-projection';
import type { HrisAction, HrisStatus } from '@/lib/hris/workspace-contracts';
import { taskDecisionRequiresComment } from '@/lib/hris/workspace-contracts';
import { hasAnyPermission, isAdminUser } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';

export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };
const schema = z.object({
  decision: z.string().trim().min(1).max(80),
  comment: z.string().trim().max(4000).nullish(),
  expectedVersion: z.number().int().positive(),
});
const managePermissions = ['HR_PEOPLE_MANAGE', 'HR_WORKFORCE_MANAGE', 'HR_PERFORMANCE_MANAGE', 'HR_LEARNING_MANAGE', 'HR_PAYROLL_MANAGE'] as PlatformModuleId[];

export async function POST(request: NextRequest, context: Context) {
  const session = await auth();
  if (!session?.user?.id) return error('UNAUTHORIZED', 'User session required.', 401);
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return error('INVALID_TASK_ID', 'A valid task id is required.', 400);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error('VALIDATION_FAILED', 'Invalid task decision.', 422, parsed.error.flatten());
  const decision = parsed.data.decision as HrisAction;
  if (taskDecisionRequiresComment(decision) && !parsed.data.comment) {
    return error('COMMENT_REQUIRED', 'Add a reason for this decision.', 422);
  }
  const canManageAll = isAdminUser(session.user) || hasAnyPermission(session.user, managePermissions);
  try {
    const task = await getHrisTaskForDecision(id, session.user.id, canManageAll);
    if (!task) return error('TASK_NOT_FOUND', 'The task is unavailable or outside your assignment scope.', 404);
    if (task.version !== parsed.data.expectedVersion) return error('VERSION_CONFLICT', 'The task changed since it was loaded.', 409);
    if (!task.allowedDecisions.includes(decision)) return error('DECISION_NOT_ALLOWED', 'That decision is not allowed at the current workflow stage.', 409);
    const handler = task.decisionHandlers[decision];
    if (!handler || handler.kind !== 'hr_workflow') return error('HANDLER_UNAVAILABLE', 'The source domain has not registered this decision handler.', 409);

    const result = await executeHrWorkflowAction({ action: handler.action, id: task.sourceId, actingUserId: session.user.id });
    if (!result.row) return error('SOURCE_CONFLICT', 'The authoritative record could not apply this decision.', 409);
    const updated = await completeHrisTaskDecision({ id, expectedVersion: task.version, status: statusAfterDecision(decision) });
    if (!updated) return error('VERSION_CONFLICT', 'The task changed while the decision was being applied.', 409);
    await logAudit('AUDIT', `Unified HRIS task decision completed: ${decision}.`, `API:HRIS:Task:${task.sourceDomain}`, session.user.id, {
      taskId: id, sourceId: task.sourceId, decision, comment: parsed.data.comment || null,
    });
    return NextResponse.json({ data: publicTask(updated) });
  } catch (cause) {
    console.error('[HRIS tasks] decision failed', cause);
    return error('TASK_DECISION_FAILED', 'The task decision could not be completed.', 500);
  }
}

function statusAfterDecision(decision: HrisAction): HrisStatus {
  if (decision === 'reject') return 'rejected';
  if (decision === 'request_changes') return 'returned_for_revision';
  if (['cancel', 'withdraw'].includes(decision)) return 'cancelled';
  if (decision === 'archive') return 'archived';
  return 'completed';
}
function publicTask<T extends { decisionHandlers?: unknown }>(task: T) { const { decisionHandlers: _handlers, ...safe } = task; return safe; }
function error(code: string, message: string, status: number, details?: unknown) { return NextResponse.json({ error: { code, message, details } }, { status }); }
