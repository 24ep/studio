import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';
import prisma from '@/lib/prisma';
import {
  adjustBalance,
  applyPolicyAssignment,
  createEncashment,
  decideEncashment,
  decideRequest,
  getEmployeeEncashmentWorkspace,
  getLeaveRequestWorkspace,
  getLeaveWorkspace,
  leaveWorkspaceActionSchema,
  previewAllocation,
  previewPolicyAssignment,
  resolveLeaveException,
  runAllocation,
  updatePeriod,
} from '@/lib/hr/leave-workspace-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VIEW_PERMISSIONS = ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE'] as PlatformModuleId[];
const MANAGE_PERMISSIONS = ['HR_WORKFORCE_MANAGE'] as PlatformModuleId[];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  if (!hasAnyPermission(session.user, VIEW_PERMISSIONS)) {
    try {
      return NextResponse.json({ data: await getEmployeeEncashmentWorkspace(session.user.id) });
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'No employee Leaves access is available.' }, { status: 403 });
    }
  }
  const view = request.nextUrl.searchParams.get('view');
  return NextResponse.json({ data: view === 'requests' ? await getLeaveRequestWorkspace() : await getLeaveWorkspace() });
}

async function ownsEmployeeRecord(userId: string, employeeId: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "hr_employees" WHERE id = $1::uuid AND user_id = $2::uuid LIMIT 1`,
    employeeId,
    userId,
  );
  return Boolean(rows[0]);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const parsed = leaveWorkspaceActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid leave action.', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const input = parsed.data;
  const canManage = hasAnyPermission(session.user, MANAGE_PERMISSIONS);
  if (!canManage) {
    const permittedSelfAction = input.action === 'create_encashment'
      && await ownsEmployeeRecord(session.user.id, input.employeeId);
    if (!permittedSelfAction) {
      return NextResponse.json({ message: 'Forbidden: Insufficient Leaves manage permission.' }, { status: 403 });
    }
  }

  try {
    let data: unknown;
    switch (input.action) {
      case 'request_decision':
        data = await decideRequest(input, session.user.id);
        break;
      case 'create_encashment':
        data = await createEncashment(input, session.user.id);
        break;
      case 'encashment_decision':
        data = await decideEncashment(input, session.user.id);
        break;
      case 'assignment_preview':
        data = await previewPolicyAssignment(input);
        break;
      case 'assignment_apply':
        data = await applyPolicyAssignment(input, session.user.id);
        break;
      case 'allocation_preview':
        data = await previewAllocation(input);
        break;
      case 'allocation_run':
        data = await runAllocation(input, session.user.id);
        break;
      case 'balance_adjustment':
        data = await adjustBalance(input, session.user.id);
        break;
      case 'period_action':
        data = await updatePeriod(input, session.user.id);
        break;
      case 'resolve_exception':
        data = await resolveLeaveException(input.id, input.resolution, session.user.id);
        break;
    }
    if (data === null) {
      return NextResponse.json({ message: 'The leave record changed or the action is no longer available.' }, { status: 409 });
    }
    await logAudit('AUDIT', `Leaves action completed: ${input.action}.`, `API:HR:Leaves:${input.action}`, session.user.id, {
      action: input.action,
      entityId: 'id' in input ? input.id : undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Leaves API] Action failed:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'The leave action failed.' }, { status: 400 });
  }
}
