import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getContractExpiry } from '@/lib/hr/contract-monitoring';
import { NotificationService } from '@/lib/notificationService';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ContractRow {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  employmentType: string;
  endDate: Date | null;
  contractNoticeDays: number;
}

function canView(user: Parameters<typeof hasAnyPermission>[0]) {
  return hasAnyPermission(user, ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'] as PlatformModuleId[]);
}

async function loadContracts() {
  return prisma.$queryRaw<ContractRow[]>`
    SELECT id, employee_number AS "employeeNumber", first_name AS "firstName", last_name AS "lastName",
      employment_type AS "employmentType", end_date AS "endDate", contract_notice_days AS "contractNoticeDays"
    FROM hr_employees
    WHERE employment_type <> 'full_time' AND status NOT IN ('inactive', 'terminated')
    ORDER BY end_date ASC NULLS FIRST
  `;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  if (!canView(session.user)) return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  const contracts = (await loadContracts()).map(employee => ({ ...employee, expiry: getContractExpiry(employee) }));
  return NextResponse.json({ contracts, attention: contracts.filter(item => ['due', 'expired', 'missing_end_date'].includes(item.expiry.state)) });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  if (!hasAnyPermission(session.user, ['HR_PEOPLE_MANAGE'] as PlatformModuleId[])) return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });

  const today = new Date().toISOString().slice(0, 10);
  const attention = (await loadContracts()).map(employee => ({ employee, expiry: getContractExpiry(employee) }))
    .filter(item => ['due', 'expired', 'missing_end_date'].includes(item.expiry.state));
  let created = 0;
  for (const item of attention) {
    const alertKey = `contract-end:${item.employee.id}:${item.expiry.state}:${today}`;
    const duplicate = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Notification" WHERE "userId" = ${session.user.id}::uuid AND data->>'alertKey' = ${alertKey} LIMIT 1
    `;
    if (duplicate[0]) continue;
    const name = `${item.employee.firstName} ${item.employee.lastName}`;
    const message = item.expiry.state === 'missing_end_date'
      ? `${name} (${item.employee.employeeNumber}) needs a contract end date.`
      : item.expiry.state === 'expired'
        ? `${name}'s contract expired ${Math.abs(item.expiry.daysRemaining || 0)} day(s) ago.`
        : `${name}'s contract ends in ${item.expiry.daysRemaining} day(s), within the configured ${item.expiry.noticeDays}-day notice period.`;
    await NotificationService.createNotification(session.user.id, {
      type: 'contract_end_alert', title: 'Employee contract requires attention', message,
      data: { alertKey, employeeId: item.employee.id, href: `/people/${item.employee.id}`, endDate: item.employee.endDate?.toISOString() || null },
    });
    created += 1;
  }
  return NextResponse.json({ created, skipped: attention.length - created, attention: attention.length });
}
