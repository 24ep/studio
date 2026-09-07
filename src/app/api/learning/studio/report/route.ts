import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { resolveLearningActor } from '@/lib/learning/learning-access';
import { getLearningReport } from '@/lib/learning/learning-management-service';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const actor = await resolveLearningActor({ id: session.user.id, email: session.user.email, role: session.user.role, modulePermissions: session.user.modulePermissions });
  if (!actor.capabilities.canViewReports) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const params = request.nextUrl.searchParams;
  try {
    const data = await getLearningReport(
      { userId: actor.userId, companyId: actor.companyId, isAdmin: actor.isAdmin },
      {
        employeeId: params.get('employeeId'),
        courseId: params.get('courseId'),
        status: params.get('status'),
        dueFrom: params.get('dueFrom'),
        dueTo: params.get('dueTo'),
        completedFrom: params.get('completedFrom'),
        completedTo: params.get('completedTo'),
      },
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load learning report';
    return NextResponse.json({ message }, { status: message.includes('company') ? 403 : 400 });
  }
}
