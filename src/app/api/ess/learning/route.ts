import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { essLearningPatchSchema, getEssDashboard, updateOwnLearning } from '@/lib/hr/ess-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const data = await getEssDashboard(session.user.id, session.user.email);
  if (!data) return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
  return NextResponse.json({ data: { learning: data.learning } });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const parsed = essLearningPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid learning action', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const data = await updateOwnLearning(session.user.id, session.user.email, parsed.data);
    if (!data) return NextResponse.json({ message: 'Learning enrollment not found.' }, { status: 404 });
    await logAudit('AUDIT', 'ESS learning progress updated.', 'API:ESS:Learning:Update', session.user.id, { id: parsed.data.id });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update learning.' }, { status: 400 });
  }
}
