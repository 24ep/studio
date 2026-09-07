import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { resolveLearningActor } from '@/lib/learning/learning-access';
import { assignLearningBatch } from '@/lib/learning/learning-assignment-service';

const schema = z.object({
  employeeId: z.string().uuid(),
  courseIds: z.array(z.string().uuid()).min(1).max(100),
  sourceType: z.enum(['course', 'path', 'manual']),
  sourceId: z.string().uuid().nullable().optional(),
  sourceLabel: z.string().trim().min(1).max(300),
  dueDate: z.string().date().nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(200),
}).superRefine((value, ctx) => {
  if (new Set(value.courseIds).size !== value.courseIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['courseIds'], message: 'Course IDs must be unique.' });
  }
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const actor = await resolveLearningActor({
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    modulePermissions: session.user.modulePermissions,
  });
  if (!actor.capabilities.canManageLearning) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid learning assignment', errors: parsed.error.flatten() }, { status: 400 });

  try {
    const data = await assignLearningBatch({
      ...parsed.data,
      actor: { userId: actor.userId, companyId: actor.companyId, isAdmin: actor.isAdmin },
    });
    return NextResponse.json({ data }, { status: data.created ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to assign learning.';
    const status = message.includes('company scope') ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
