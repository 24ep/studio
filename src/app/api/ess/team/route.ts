import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { applyTeamAction, essTeamActionSchema, getEssTeamDashboard } from '@/lib/hr/ess-service';
import { listManagerEssApprovals } from '@/lib/hr/ess-request-service';
import { applyManagerBenefitAction, benefitTeamActionSchema, listManagerBenefitApprovals } from '@/lib/hr/benefit-team-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  try {
    const [data, approvals, benefitApprovals] = await Promise.all([
      getEssTeamDashboard(session.user.id, session.user.email),
      listManagerEssApprovals(session.user.id, session.user.email),
      listManagerBenefitApprovals(session.user.id, session.user.email),
    ]);
    if (data.metrics.directReports === 0) {
      return NextResponse.json({ message: 'Manager access is required for My Team.' }, { status: 403 });
    }
    return NextResponse.json({ data: { ...data, approvals: [...approvals, ...benefitApprovals] } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to load team dashboard.' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  const isBenefitAction = typeof body?.action === 'string' && body.action.endsWith('_benefit');

  if (isBenefitAction) {
    const parsed = benefitTeamActionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: 'Invalid benefit action', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    try {
      const data = await applyManagerBenefitAction(session.user.id, session.user.email, parsed.data);
      if (!data) return NextResponse.json({ message: 'Benefit request not found or not available to this manager.' }, { status: 404 });
      await logAudit('AUDIT', `MSS benefit action completed: ${parsed.data.action}.`, 'API:ESS:Team:BenefitAction', session.user.id, { id: parsed.data.id, comment: parsed.data.comment || null });
      return NextResponse.json({ data });
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
      if (error instanceof Error && (error.message === 'STALE_BENEFIT' || error.message.startsWith('Benefit action is no longer available'))) return NextResponse.json({ message: 'Benefit request changed or this action is no longer available.' }, { status: 409 });
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to apply benefit action.' }, { status: 400 });
    }
  }

  const parsed = essTeamActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: 'Invalid team action', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const data = await applyTeamAction(session.user.id, session.user.email, parsed.data);
    if (!data) return NextResponse.json({ message: 'Team request not found or not available to this manager.' }, { status: 404 });
    await logAudit('AUDIT', `MSS team action completed: ${parsed.data.action}.`, 'API:ESS:Team:Action', session.user.id, { id: parsed.data.id });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to apply team action.' }, { status: 400 });
  }
}
