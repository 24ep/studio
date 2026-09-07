import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import prisma from '@/lib/prisma';
import { getPayrollAccess } from '@/lib/payroll/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  employeeId: z.string().uuid(),
  inputType: z.enum(['earning', 'pre_tax_deduction', 'deduction', 'post_tax_deduction', 'tax']),
  componentCode: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9_-]+$/),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().length(3).transform(value => value.toUpperCase()).default('THB'),
  effectiveDate: z.string().date(),
  taxable: z.boolean().default(false),
  reason: z.string().trim().min(2).max(2000),
});

const decisionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'cancel']),
  reason: z.string().trim().min(2).max(2000),
});

type Row = Record<string, unknown>;

async function context() {
  const session = await auth();
  if (!session?.user?.id) return { response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  const access = await getPayrollAccess(session.user);
  if (!access.canManage && !access.canApprove) {
    return { response: NextResponse.json({ message: 'Payroll management or approval permission required.' }, { status: 403 }) };
  }
  return { session, access };
}

export async function GET() {
  const resolved = await context();
  if ('response' in resolved) return resolved.response;
  const companyId = resolved.access.actorCompanyId;
  const [records, employees] = await Promise.all([
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT input.id, input.employee_id, input.payroll_run_id, input.input_type, input.component_code,
              CASE WHEN $2::boolean THEN input.amount ELSE NULL END AS amount,
              input.units, input.currency, input.effective_date, input.approval_status,
              input.status, input.source_module, input.source_record_id,
              CASE WHEN $2::boolean THEN input.metadata ELSE input.metadata - 'amount' - 'salary' END AS metadata,
              input.created_by_id, input.created_at, input.updated_at,
              concat(employee.first_name, ' ', employee.last_name) AS employee_name,
              employee.employee_number, department.name AS department_name,
              creator.name AS creator_name
         FROM hr_payroll_inputs input
         JOIN hr_employees employee ON employee.id = input.employee_id
         LEFT JOIN hr_departments department ON department.id = employee.department_id
         LEFT JOIN "User" creator ON creator.id = input.created_by_id
        WHERE ($1::uuid IS NULL OR input.company_id = $1::uuid)
        ORDER BY input.created_at DESC
        LIMIT 300`,
      companyId,
      resolved.access.canViewAmounts,
    ),
    prisma.$queryRawUnsafe<Row[]>(
      `SELECT employee.id, employee.employee_number,
              concat(employee.first_name, ' ', employee.last_name) AS name,
              department.name AS department_name
         FROM hr_employees employee
         LEFT JOIN hr_departments department ON department.id = employee.department_id
        WHERE employee.status IN ('active','probation','onboarding','notice')
          AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
        ORDER BY employee.first_name, employee.last_name
        LIMIT 1000`,
      companyId,
    ),
  ]);
  return NextResponse.json({
    data: {
      records,
      employees,
      access: {
        canManage: resolved.access.canManage,
        canApprove: resolved.access.canApprove,
        canViewAmounts: resolved.access.canViewAmounts,
      },
    },
  });
}

export async function POST(request: Request) {
  const resolved = await context();
  if ('response' in resolved) return resolved.response;
  if (!resolved.access.canManage) return NextResponse.json({ message: 'Payroll management permission required.' }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid payroll adjustment.', details: parsed.error.flatten() }, { status: 422 });

  const employee = await prisma.$queryRawUnsafe<Array<{ id: string; company_id: string | null }>>(
    `SELECT id, company_id FROM hr_employees
      WHERE id = $1::uuid AND ($2::uuid IS NULL OR company_id = $2::uuid) LIMIT 1`,
    parsed.data.employeeId,
    resolved.access.actorCompanyId,
  );
  if (!employee[0]) return NextResponse.json({ message: 'Employee is outside your payroll scope.' }, { status: 404 });

  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO hr_payroll_inputs
      (id, company_id, employee_id, input_type, component_code, amount, currency,
       source_module, source_record_id, effective_date, approval_status, status,
       idempotency_key, created_by_id, metadata, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, 'manual', $1::text,
             $8::date, 'pending', 'pending', $9, $10::uuid, $11::jsonb, now(), now())
     RETURNING *`,
    id,
    employee[0].company_id || null,
    parsed.data.employeeId,
    parsed.data.inputType,
    parsed.data.componentCode.toUpperCase(),
    parsed.data.amount,
    parsed.data.currency,
    parsed.data.effectiveDate,
    `manual-input:${id}`,
    resolved.session.user.id,
    JSON.stringify({ taxable: parsed.data.taxable, reason: parsed.data.reason, source: 'manual' }),
  );
  await logAudit('AUDIT', 'Manual payroll adjustment created.', 'Payroll:Input:Create', resolved.session.user.id, {
    inputId: id,
    employeeId: parsed.data.employeeId,
    componentCode: parsed.data.componentCode.toUpperCase(),
    amount: parsed.data.amount,
    reason: parsed.data.reason,
  });
  return NextResponse.json({ data: rows[0] }, { status: 201 });
}

export async function PATCH(request: Request) {
  const resolved = await context();
  if ('response' in resolved) return resolved.response;
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid adjustment decision.', details: parsed.error.flatten() }, { status: 422 });

  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT input.* FROM hr_payroll_inputs input
      WHERE input.id = $1::uuid AND ($2::uuid IS NULL OR input.company_id = $2::uuid)
      LIMIT 1`,
    parsed.data.id,
    resolved.access.actorCompanyId,
  );
  const current = rows[0];
  if (!current) return NextResponse.json({ message: 'Payroll adjustment not found.' }, { status: 404 });
  if (current.payroll_run_id) return NextResponse.json({ message: 'This adjustment is already attached to a payroll run and can no longer be changed here.' }, { status: 409 });

  if (parsed.data.action === 'cancel') {
    if (!resolved.access.canManage) return NextResponse.json({ message: 'Payroll management permission required.' }, { status: 403 });
    if (!['pending', 'draft'].includes(String(current.status))) return NextResponse.json({ message: 'Only pending adjustments can be cancelled.' }, { status: 409 });
    const updated = await prisma.$queryRawUnsafe<Row[]>(
      `UPDATE hr_payroll_inputs SET approval_status = 'cancelled', status = 'cancelled',
              metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = now()
        WHERE id = $1::uuid RETURNING *`,
      parsed.data.id,
      JSON.stringify({ decisionReason: parsed.data.reason, decidedBy: resolved.session.user.id }),
    );
    await logAudit('AUDIT', 'Manual payroll adjustment cancelled.', 'Payroll:Input:Cancel', resolved.session.user.id, { inputId: parsed.data.id, reason: parsed.data.reason });
    return NextResponse.json({ data: updated[0] });
  }

  if (!resolved.access.canApprove) return NextResponse.json({ message: 'Payroll approval permission required.' }, { status: 403 });
  if (String(current.created_by_id || '') === resolved.session.user.id) {
    return NextResponse.json({ message: 'The creator cannot approve or reject their own payroll adjustment.' }, { status: 409 });
  }
  if (!['pending', 'pending_approval'].includes(String(current.status))) return NextResponse.json({ message: 'Only pending adjustments can be reviewed.' }, { status: 409 });

  const approved = parsed.data.action === 'approve';
  const updated = await prisma.$queryRawUnsafe<Row[]>(
    `UPDATE hr_payroll_inputs
        SET approval_status = $2, status = $3,
            metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb, updated_at = now()
      WHERE id = $1::uuid RETURNING *`,
    parsed.data.id,
    approved ? 'approved' : 'rejected',
    approved ? 'ready' : 'rejected',
    JSON.stringify({ decisionReason: parsed.data.reason, decidedBy: resolved.session.user.id, decidedAt: new Date().toISOString() }),
  );
  await logAudit('AUDIT', `Manual payroll adjustment ${approved ? 'approved' : 'rejected'}.`, `Payroll:Input:${approved ? 'Approve' : 'Reject'}`, resolved.session.user.id, {
    inputId: parsed.data.id,
    reason: parsed.data.reason,
  });
  return NextResponse.json({ data: updated[0] });
}
