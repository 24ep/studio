import { NextResponse, type NextRequest } from 'next/server';

import prisma from '@/lib/prisma';
import { validateUuid } from '@/lib/security';
import { requirePositionViewSession } from '../position-detail-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const authorization = await requirePositionViewSession();
  if (!authorization.ok) return authorization.response;

  const { id } = await params;
  if (!validateUuid(id)) {
    return NextResponse.json({ error: 'Invalid position ID format' }, { status: 400 });
  }

  try {
    const employees = await prisma.$queryRaw<Array<{
      id: string;
      displayName: string;
      jobTitle: string | null;
      department: string | null;
      mail: string | null;
    }>>`
      SELECT
        employee.id,
        TRIM(CONCAT_WS(' ', employee.first_name, employee.last_name)) AS "displayName",
        employee.job_title AS "jobTitle",
        COALESCE(department.name, department.department) AS department,
        employee.email AS mail
      FROM hr_employees employee
      LEFT JOIN hr_departments department ON department.id = employee.department_id
      WHERE employee.position_id = ${id}::uuid
        AND employee.status IN ('active', 'onboarding', 'probation')
      ORDER BY employee.first_name ASC, employee.last_name ASC
    `;

    return NextResponse.json({ employees });
  } catch (error) {
    console.error(`[Position Employees API] Failed to fetch employees for position ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch existing employees' }, { status: 500 });
  }
}
