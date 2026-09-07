import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { resolveLearningActor } from '@/lib/learning/learning-access';
import { getLearningManagementOverview } from '@/lib/learning/learning-management-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const actor = await resolveLearningActor({ id: session.user.id, email: session.user.email, role: session.user.role, modulePermissions: session.user.modulePermissions });
  if (!actor.capabilities.canViewLearningManagement) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const data = await getLearningManagementOverview({ userId: actor.userId, companyId: actor.companyId, isAdmin: actor.isAdmin });
    return NextResponse.json({ data, capabilities: actor.capabilities });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load Learning Management';
    return NextResponse.json({ message }, { status: message.includes('company') ? 403 : 400 });
  }
}
