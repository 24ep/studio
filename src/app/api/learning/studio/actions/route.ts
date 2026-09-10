import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { resolveLearningActor } from '@/lib/learning/learning-access';
import { LearningConflictError, overrideLearningCompletion, reviewLearningAssignment } from '@/lib/learning/learning-management-service';

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('review_assignment'),
    submissionId: z.string().uuid(),
    approved: z.boolean(),
    feedback: z.string().max(5000).optional(),
    expectedUpdatedAt: z.string().datetime(),
  }),
  z.object({ action: z.literal('override_completion'), enrollmentId: z.string().uuid(), reason: z.string().trim().min(5).max(2000) }),
]);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const actor = await resolveLearningActor({ id: session.user.id, email: session.user.email, role: session.user.role, modulePermissions: session.user.modulePermissions });
  if (!actor.capabilities.canManageLearning) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid action', errors: parsed.error.flatten() }, { status: 400 });
  const managementActor = { userId: actor.userId, companyId: actor.companyId, isAdmin: actor.isAdmin };

  try {
    const data = parsed.data.action === 'review_assignment'
      ? await reviewLearningAssignment({ ...parsed.data, actor: managementActor })
      : await overrideLearningCompletion({ ...parsed.data, actor: managementActor });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof LearningConflictError) return NextResponse.json({ message: error.message }, { status: 409 });
    const message = error instanceof Error ? error.message : 'Unable to complete action';
    return NextResponse.json({ message }, { status: message.includes('company scope') ? 403 : 400 });
  }
}
