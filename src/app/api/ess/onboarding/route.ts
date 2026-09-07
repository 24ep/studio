import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { essOnboardingPatchSchema, getEssDashboard, updateOwnOnboarding } from '@/lib/hr/ess-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const data = await getEssDashboard(session.user.id, session.user.email);
  if (!data) return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
  return NextResponse.json({ data: { onboarding: data.onboarding, onboardingTasks: data.onboardingTasks } });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const parsed = essOnboardingPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid onboarding action', errors: parsed.error.flatten().fieldErrors }, { status: 400 });

  try {
    const dashboard = await getEssDashboard(session.user.id, session.user.email);
    if (!dashboard) return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });

    const ownsCase = dashboard.onboarding.some(item => String(item.id) === parsed.data.onboardingId);
    if (!ownsCase) return NextResponse.json({ message: 'Onboarding item not found.' }, { status: 404 });

    if (parsed.data.action === 'complete_case') {
      return NextResponse.json({ message: 'Onboarding completion is finalized by the People workflow after all owners finish their tasks.' }, { status: 403 });
    }

    if (parsed.data.action === 'complete_task') {
      const task = dashboard.onboardingTasks.find(item => (
        String(item.onboarding_id) === parsed.data.onboardingId
        && String(item.task_id) === parsed.data.taskId
      ));
      if (!task) return NextResponse.json({ message: 'Onboarding task not found.' }, { status: 404 });
      if (String(task.owner_role || '').toLowerCase() !== 'employee') {
        return NextResponse.json({ message: 'This onboarding task is owned by another team and cannot be completed from employee self-service.' }, { status: 403 });
      }
    }

    const data = await updateOwnOnboarding(session.user.id, session.user.email, parsed.data);
    if (!data) return NextResponse.json({ message: 'Onboarding item not found.' }, { status: 404 });
    await logAudit('AUDIT', 'ESS onboarding updated.', 'API:ESS:Onboarding:Update', session.user.id, {
      onboardingId: parsed.data.onboardingId,
      taskId: parsed.data.taskId || null,
      action: parsed.data.action,
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update onboarding.' }, { status: 400 });
  }
}
