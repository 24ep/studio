import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { clockOwnAttendance, essAttendanceActionSchema, getOwnAttendanceClock } from '@/lib/hr/ess-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }

  try {
    const data = await getOwnAttendanceClock(session.user.id, session.user.email);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') {
      return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Unable to load attendance clock.' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }

  const parsed = essAttendanceActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid attendance action', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const data = await clockOwnAttendance(session.user.id, session.user.email, {
      ...parsed.data,
      idempotencyKey: parsed.data.idempotencyKey
        || request.headers.get('idempotency-key')
        || crypto.randomUUID(),
      deviceId: parsed.data.deviceId || request.headers.get('x-device-id'),
    });
    await logAudit('AUDIT', `ESS attendance ${parsed.data.action.replace('_', ' ')}.`, 'API:ESS:Attendance:Clock', session.user.id, {
      id: data?.id,
      action: parsed.data.action,
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') {
      return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update attendance clock.' }, { status: 400 });
  }
}
