import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { createEssLeaveRequest, essLeaveRequestSchema, getEssDashboard } from '@/lib/hr/ess-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }

  const data = await getEssDashboard(session.user.id, session.user.email);
  if (!data) {
    return NextResponse.json(
      {
        data: null,
        state: 'unlinked',
        message: 'No employee record is linked to this user yet.',
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  return NextResponse.json(
    { data, state: 'ready' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }

  const parsed = essLeaveRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid leave request', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const data = await createEssLeaveRequest(session.user.id, session.user.email, parsed.data);
    await logAudit('AUDIT', 'Employee self-service leave request created.', 'API:ESS:LeaveRequest:Create', session.user.id, { id: data.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') {
      return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to create leave request.' }, { status: 400 });
  }
}
