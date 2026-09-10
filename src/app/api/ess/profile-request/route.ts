import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { createProfileChangeRequest, essProfileRequestSchema } from '@/lib/hr/ess-service';

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });

  const parsed = essProfileRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid profile change request', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const data = await createProfileChangeRequest(session.user.id, session.user.email, parsed.data);
    await logAudit('AUDIT', 'ESS profile change request submitted.', 'API:ESS:ProfileRequest:Create', session.user.id, { id: data.id });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') {
      return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to submit profile change request.' }, { status: 400 });
  }
}
