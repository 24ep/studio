import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { employeeContext } from '@/lib/privacy-support';
import { handlePrivacySupportApi } from '@/lib/privacy-support-api';
import prisma from '@/lib/prisma';

async function listCategories() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const employee = await employeeContext(session.user);
  const categories = await prisma.$queryRawUnsafe<Array<{ key: string; label: string; aiEnabled: boolean }>>(
    `SELECT key, label, ai_enabled AS "aiEnabled"
       FROM service_desk_categories
      WHERE company_id IS NOT DISTINCT FROM $1::uuid AND is_active = true
      ORDER BY sort_order, lower(label), id`,
    employee.companyId,
  );
  return NextResponse.json({
    categories,
  });
}

export function GET() {
  return handlePrivacySupportApi('Loading service desk categories', listCategories);
}
