import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { resolveEssFileAccess } from '@/lib/hr/ess-service';
import { streamSecureFileObject } from '@/app/api/secure-file/stream/secure-file-stream-storage';
import { logAudit } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });

  const kind = request.nextUrl.searchParams.get('kind');
  const id = request.nextUrl.searchParams.get('id');
  if ((kind !== 'document' && kind !== 'payslip') || !id) {
    return NextResponse.json({ message: 'A valid file kind and id are required.' }, { status: 400 });
  }

  try {
    const access = await resolveEssFileAccess({ userId: session.user.id, email: session.user.email, kind, id });
    if (!access) return NextResponse.json({ message: 'File not found or not available.' }, { status: 404 });
    await logAudit('AUDIT', `ESS ${kind} accessed.`, 'API:ESS:File:Access', session.user.id, {
      id,
      kind,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: request.headers.get('user-agent'),
    });
    return streamSecureFileObject(request, access);
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to stream ESS file.' }, { status: 400 });
  }
}
