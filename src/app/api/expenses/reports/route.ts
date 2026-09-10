import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import { getExpenseAccess } from '@/lib/expenses/permissions';
import prisma from '@/lib/prisma';

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  const employee = await getEmployeeForUser(session.user.id, session.user.email) as unknown as { company_id: string | null } | null;
  const access = getExpenseAccess(session.user, Boolean(employee));
  if (!access.canFinance && !access.canAudit) {
    return NextResponse.json({ message: 'Finance or audit access is required to export expense reports.' }, { status: 403 });
  }
  const report = request.nextUrl.searchParams.get('report') || 'claims';
  if (!['claims', 'advances', 'travel', 'accounting'].includes(report)) {
    return NextResponse.json({ message: 'Report type is not supported.' }, { status: 400 });
  }
  const table = {
    claims: 'expense_claims',
    advances: 'employee_advances',
    travel: 'travel_requests',
    accounting: 'expense_accounting_entries',
  }[report]!;
  const amount = {
    claims: 'claimed_amount',
    advances: 'requested_amount',
    travel: 'estimated_amount',
    accounting: 'total_debit',
  }[report]!;
  const currency = {
    claims: 'claim_currency',
    advances: 'currency',
    travel: 'currency',
    accounting: 'currency',
  }[report]!;
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT reference, status, ${amount} AS amount, ${currency} AS currency, company_id, created_at, updated_at
     FROM "${table}"
     WHERE ($1::uuid IS NULL OR company_id = $1::uuid OR company_id IS NULL)
     ORDER BY created_at DESC
     LIMIT 10000`,
    employee?.company_id || null,
  );
  const csv = [
    ['Reference', 'Status', 'Amount', 'Currency', 'Company', 'Created', 'Updated'].map(csvCell).join(','),
    ...rows.map(row => [
      row.reference, row.status, row.amount, row.currency, row.company_id, row.created_at, row.updated_at,
    ].map(csvCell).join(',')),
  ].join('\n');
  await logAudit('AUDIT', `Expense ${report} report exported`, 'API:Expenses:Report', session.user.id, {
    report,
    rowCount: rows.length,
  });
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="expense-${report}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
