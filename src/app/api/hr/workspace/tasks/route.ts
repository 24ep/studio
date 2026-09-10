import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { listHrisTaskProjections } from '@/lib/hris/task-projection';
import type { HrisStatus, HrisTaskPriority } from '@/lib/hris/workspace-contracts';
import { hasAnyPermission, isAdminUser } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const querySchema = z.object({
  query: z.string().max(200).optional(),
  status: z.string().max(400).optional(),
  priority: z.string().max(200).optional(),
  domain: z.string().max(400).optional(),
  companyId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  dueBefore: z.string().datetime().optional(),
  cursor: z.string().uuid().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const managePermissions = [
  'HR_PEOPLE_MANAGE', 'HR_WORKFORCE_MANAGE', 'HR_PERFORMANCE_MANAGE',
  'HR_LEARNING_MANAGE', 'HR_PAYROLL_MANAGE',
] as PlatformModuleId[];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return error('UNAUTHORIZED', 'User session required.', 401);
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return error('INVALID_QUERY', 'Invalid task filters.', 400, parsed.error.flatten());
  const allowAssigneeOverride = isAdminUser(session.user) || hasAnyPermission(session.user, managePermissions);
  if (parsed.data.assigneeId && !allowAssigneeOverride && parsed.data.assigneeId !== session.user.id) {
    return error('FORBIDDEN', 'You cannot view another user’s task inbox.', 403);
  }
  try {
    const page = await listHrisTaskProjections({
      actorUserId: session.user.id,
      allowAssigneeOverride,
      filter: {
        query: parsed.data.query,
        statuses: split(parsed.data.status) as HrisStatus[],
        priorities: split(parsed.data.priority) as HrisTaskPriority[],
        domains: split(parsed.data.domain),
        companyId: parsed.data.companyId,
        assigneeId: parsed.data.assigneeId,
        dueBefore: parsed.data.dueBefore,
        cursor: parsed.data.cursor,
        pageSize: parsed.data.pageSize,
      },
    });
    return NextResponse.json({
      data: {
        ...page,
        records: page.records.map(record => {
          const { decisionHandlers: _handlers, ...safe } = record;
          return safe;
        }),
      },
    });
  } catch (cause) {
    console.error('[HRIS tasks] list failed', cause);
    return error('TASK_PROJECTION_UNAVAILABLE', 'The task projection migration may not have been applied.', 503);
  }
}

function split(value?: string) { return value ? value.split(',').map(item => item.trim()).filter(Boolean) : undefined; }
function error(code: string, message: string, status: number, details?: unknown) { return NextResponse.json({ error: { code, message, details } }, { status }); }
