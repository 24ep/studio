import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPayrollAccess } from '@/lib/payroll/permissions';
import { getPayrollRunTypes } from '@/lib/payroll/run-type-registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const access = await getPayrollAccess(session.user);
  if (!access.canView) return NextResponse.json({ message: 'Payroll view permission required.' }, { status: 403 });
  return NextResponse.json({ data: { runTypes: await getPayrollRunTypes() } });
}
