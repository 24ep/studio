import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { acknowledgeOwnDocument } from '@/lib/hr/ess-action-service';
import { essDocumentActionSchema } from '@/lib/hr/ess-contracts';
import { getEssDashboard } from '@/lib/hr/ess-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const data = await getEssDashboard(session.user.id, session.user.email);
  if (!data) return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
  return NextResponse.json({ data: { documents: data.documents } });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  const parsed = essDocumentActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid document action.' }, { status: 400 });
  try {
    const data = await acknowledgeOwnDocument({
      userId: session.user.id,
      email: session.user.email,
      documentId: parsed.data.id,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: request.headers.get('user-agent'),
    });
    if (!data) return NextResponse.json({ message: 'Document not found or acknowledgment is not required.' }, { status: 404 });
    await logAudit('AUDIT', 'ESS document acknowledged.', 'API:ESS:Document:Acknowledge', session.user.id, { id: parsed.data.id });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') {
      return NextResponse.json({ message: 'No employee record is linked to this user.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Unable to acknowledge document.' }, { status: 400 });
  }
}
