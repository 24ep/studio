import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { resolveLearningActor } from '@/lib/learning/learning-access';
import { getLearningCatalog } from '@/lib/learning/learning-self-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const actor = await resolveLearningActor({
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    modulePermissions: session.user.modulePermissions,
  });

  return NextResponse.json({
    data: await getLearningCatalog(actor.employeeId),
    capabilities: actor.capabilities,
  });
}
