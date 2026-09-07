import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: 'Unauthorized: User session required.' },
      { status: 401 },
    );
  }

  const employees = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id
       FROM hr_employees
      WHERE user_id = $1::uuid OR lower(email) = lower($2)
      ORDER BY CASE WHEN user_id = $1::uuid THEN 0 ELSE 1 END
      LIMIT 1`,
    session.user.id,
    session.user.email || '',
  );
  const employee = employees[0];
  if (!employee) {
    return NextResponse.json(
      { message: 'No employee record is linked to this user yet.' },
      { status: 404 },
    );
  }

  const payslips = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT payslip.id, payslip.status, payslip.published_at, payslip.created_at,
            payslip.currency, payslip.gross_pay, payslip.total_deductions,
            payslip.net_pay, payslip.download_count, payslip.last_downloaded_at,
            period.name AS period_name, period.pay_date
       FROM hr_payslips payslip
       LEFT JOIN hr_payroll_periods period ON period.id = payslip.payroll_period_id
      WHERE payslip.employee_id = $1::uuid
        AND payslip.status = 'released'
      ORDER BY period.pay_date DESC NULLS LAST, payslip.published_at DESC NULLS LAST,
               payslip.created_at DESC
      LIMIT 60`,
    employee.id,
  );

  return NextResponse.json({ data: { payslips } });
}
