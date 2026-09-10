import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { performanceMutationSchema } from '@/lib/performance/performance-contracts';
import {
  getPerformanceWorkspace,
  mutatePerformanceWorkspace,
} from '@/lib/performance/performance-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const data = await getPerformanceWorkspace({
      user: session.user,
      selectedEmployeeId: request.nextUrl.searchParams.get('employeeId'),
    });
    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error('[Performance API] Workspace load failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load the Performance workspace.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }
  const parsed = performanceMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Review the highlighted performance action fields.', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const data = await mutatePerformanceWorkspace(session.user, parsed.data);
    await logAudit(
      'AUDIT',
      `Performance action completed: ${parsed.data.action}.`,
      `API:Performance:${parsed.data.action}`,
      session.user.id,
      {
        action: parsed.data.action,
        entityId: 'id' in parsed.data ? parsed.data.id : null,
        employeeId: 'employeeId' in parsed.data
          ? parsed.data.employeeId
          : 'recipientId' in parsed.data
            ? parsed.data.recipientId
            : null,
      },
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to complete the performance action.';
    const conflict = /changed before|idempot/i.test(message);
    const forbidden = /outside your authorized|do not have access|policy/.test(message);
    return NextResponse.json(
      { message },
      { status: conflict ? 409 : forbidden ? 403 : 400 },
    );
  }
}
