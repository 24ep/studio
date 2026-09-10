import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resignationSchema = z.object({
  lastWorkingDate: z.string().date(),
  reason: z.string().trim().min(10, 'Please provide at least 10 characters.').max(4000),
}).superRefine((value, context) => {
  const today = new Date().toISOString().slice(0, 10);
  if (value.lastWorkingDate < today) context.addIssue({ code: 'custom', path: ['lastWorkingDate'], message: 'Last working date cannot be in the past.' });
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'User session required.' }, { status: 401 });

  const employee = await getEmployeeForUser(session.user.id, session.user.email);
  if (!employee) return NextResponse.json({ error: 'No employee record is linked to this account.' }, { status: 404 });

  const parsed = resignationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid resignation request.' }, { status: 422 });

  const existing = await prisma.hr_exit_cases.findFirst({
    where: { employee_id: employee.id, status: { in: ['draft', 'submitted', 'approved', 'in_progress'] } },
    orderBy: { created_at: 'desc' },
  });
  if (existing) return NextResponse.json({ error: 'An active offboarding request already exists.', data: { id: existing.id, status: existing.status } }, { status: 409 });

  const created = await prisma.hr_exit_cases.create({
    data: {
      employee_id: employee.id,
      company_id: employee.company_id || null,
      exit_type: 'resignation',
      status: 'submitted',
      notice_date: new Date(),
      last_working_date: new Date(`${parsed.data.lastWorkingDate}T00:00:00.000Z`),
      reason: parsed.data.reason,
      requested_by_id: session.user.id,
      checklist: [],
    },
  });

  await logAudit('AUDIT', 'Employee submitted a resignation request.', 'API:HR:SelfService:Resignation', session.user.id, {
    exitCaseId: created.id,
    employeeId: employee.id,
    lastWorkingDate: parsed.data.lastWorkingDate,
  });

  return NextResponse.json({ data: { id: created.id, status: created.status } }, { status: 201 });
}
