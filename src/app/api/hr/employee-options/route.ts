import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const permissions = ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE', 'HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE', 'HR_LEARNING_VIEW', 'HR_LEARNING_MANAGE'] as PlatformModuleId[];
  if (!hasAnyPermission(session.user, permissions)) return NextResponse.json({ message: 'Forbidden: Insufficient HR permission.' }, { status: 403 });
  const employees = await prisma.$queryRaw<Array<{ id: string; employeeNumber: string; firstName: string; lastName: string; preferredName: string | null; jobTitle: string | null; departmentName: string | null; avatarUrl: string | null }>>`
    SELECT e.id, e.employee_number AS "employeeNumber", e.first_name AS "firstName", e.last_name AS "lastName",
           e.preferred_name AS "preferredName", e.job_title AS "jobTitle", COALESCE(d.name, d.department) AS "departmentName",
           COALESCE(u."avatarUrl", e.profile_photo_url) AS "avatarUrl"
    FROM "hr_employees" e
    LEFT JOIN "hr_departments" d ON d.id = e.department_id
    LEFT JOIN "User" u ON u.id = e.user_id
    WHERE e.status IN ('active', 'probation', 'onboarding')
    ORDER BY e.first_name, e.last_name
    LIMIT 1000
  `;
  return NextResponse.json({ employees });
}
