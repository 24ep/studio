import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { searchEssEmployees } from '@/lib/hr/ess-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const query = request.nextUrl.searchParams.get('query') || '';
  try {
    return NextResponse.json({ employees: await searchEssEmployees(session.user.id, session.user.email, query) });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user yet.' }, { status: 404 });
    return NextResponse.json({ message: 'Unable to search employees.' }, { status: 400 });
  }
}
