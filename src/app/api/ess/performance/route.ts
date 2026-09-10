import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { essPerformanceActionSchema } from '@/lib/hr/ess-contracts';
import { updateOwnPerformance } from '@/lib/hr/ess-action-service';
import { getEssDashboard } from '@/lib/hr/ess-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  const data = await getEssDashboard(session.user.id, session.user.email);
  if (!data) return NextResponse.json({ message: 'No employee record is linked to this user.' }, { status: 404 });
  return NextResponse.json({ data: { performance: data.performance, goals: data.goals } }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  const parsed = essPerformanceActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid performance action.', errors: parsed.error.flatten() }, { status: 400 });
  try {
    const data = await updateOwnPerformance({ userId: session.user.id, email: session.user.email, input: parsed.data });
    if (!data) return NextResponse.json({ message: 'The record changed or the action is no longer available.' }, { status: 409 });
    await logAudit('AUDIT', `ESS performance ${parsed.data.action}.`, 'API:ESS:Performance:Action', session.user.id, {
      id: parsed.data.id,
      action: parsed.data.action,
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') {
      return NextResponse.json({ message: 'No employee record is linked to this user.' }, { status: 404 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update performance action.' }, { status: 400 });
  }
}
