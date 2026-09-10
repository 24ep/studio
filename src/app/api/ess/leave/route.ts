import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { cancelOwnLeaveRequest, createEssGroupedLeaveRequest, essGroupedLeaveRequestSchema, essLeavePatchSchema, getEssDashboard } from '@/lib/hr/ess-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const data = await getEssDashboard(session.user.id, session.user.email);
  if (!data) return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
  return NextResponse.json({ data: { leaveBalances: data.leaveBalances, leaveRequests: data.leaveRequests } });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const parsed = essGroupedLeaveRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid leave request', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const data = await createEssGroupedLeaveRequest(session.user.id, session.user.email, parsed.data);
    await logAudit('AUDIT', 'ESS leave request submitted.', 'API:ESS:Leave:Create', session.user.id, { id: data.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to create leave request.' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const parsed = essLeavePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid leave action', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const data = await cancelOwnLeaveRequest(
      session.user.id,
      session.user.email,
      parsed.data.id,
      parsed.data.action,
      parsed.data.expectedVersion,
    );
    if (!data) return NextResponse.json({ message: 'Leave request changed or this action is no longer available.' }, { status: 409 });
    await logAudit('AUDIT', `ESS leave request ${parsed.data.action}.`, 'API:ESS:Leave:Action', session.user.id, {
      id: parsed.data.id,
      action: parsed.data.action,
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to cancel leave request.' }, { status: 400 });
  }
}
