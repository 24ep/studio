import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { resolveCompanyScope } from '@/lib/hr/company-scope';
import { payrollRunActionSchema, payrollRunTypes } from '@/lib/payroll/contracts';
import { getPayrollAccess } from '@/lib/payroll/permissions';
import { mutatePayroll, PayrollServiceError } from '@/lib/payroll/service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  periodId: z.string().uuid(),
  companyId: z.string().uuid().nullish(),
  payrollGroupId: z.string().uuid().nullish(),
  runType: z.enum(payrollRunTypes).default('regular'),
  idempotencyKey: z.string().min(8).max(200),
});

function apiError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

async function requirePayroll(manage: boolean | null = false) {
  const session = await auth();
  if (!session?.user?.id) return { response: apiError('UNAUTHORIZED', 'User session required.', 401) };
  const access = await getPayrollAccess(session.user);
  const allowed =
    manage === null
      ? access.canManage || access.canApprove
      : manage
        ? access.canManage
        : access.canView;
  if (!allowed)
    return { response: apiError('FORBIDDEN', 'Payroll permission required.', 403) };
  return { session, access, actorCompanyId: access.actorCompanyId };
}

export async function GET(request: NextRequest) {
  const access = await requirePayroll();
  if ('response' in access) return access.response;
  const requestedCompanyId = request.nextUrl.searchParams.get('companyId');
  const companyScope = resolveCompanyScope(access.actorCompanyId, requestedCompanyId);
  if (!companyScope.allowed) {
    return apiError('COMPANY_SCOPE_VIOLATION', 'The requested company is outside your access scope.', 403);
  }
  const companyId = companyScope.companyId;
  try {
    const runs = companyId
      ? await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT run.*, period.name AS period_name, period.pay_date,
          COALESCE(exception.open_exceptions, 0)::int AS open_exceptions
         FROM hr_payroll_runs run
         JOIN hr_payroll_periods period ON period.id = run.period_id
         LEFT JOIN LATERAL (
           SELECT COUNT(*) AS open_exceptions FROM hr_payroll_exceptions item
           WHERE item.payroll_run_id = run.id AND item.status = 'open'
         ) exception ON TRUE
         WHERE run.company_id = $1::uuid ORDER BY run.created_at DESC LIMIT 100`,
        companyId,
      )
      : await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT run.*, period.name AS period_name, period.pay_date,
          COALESCE(exception.open_exceptions, 0)::int AS open_exceptions
         FROM hr_payroll_runs run
         JOIN hr_payroll_periods period ON period.id = run.period_id
         LEFT JOIN LATERAL (
           SELECT COUNT(*) AS open_exceptions FROM hr_payroll_exceptions item
           WHERE item.payroll_run_id = run.id AND item.status = 'open'
         ) exception ON TRUE
         ORDER BY run.created_at DESC LIMIT 100`,
      );
    return NextResponse.json({ data: runs });
  } catch (cause) {
    console.error('[Payroll v1] List failed', cause);
    return apiError('RESOURCE_UNAVAILABLE', 'Apply the HRIS foundation migration to enable payroll v1.', 503);
  }
}

export async function POST(request: NextRequest) {
  const access = await requirePayroll(null);
  if ('response' in access) return access.response;
  const raw = await request.json().catch(() => null);

  if (raw?.action) {
    const parsed = payrollRunActionSchema.safeParse(raw);
    if (!parsed.success) return apiError('VALIDATION_FAILED', 'Invalid payroll action.', 422, parsed.error.flatten());
    try {
      const data = await mutatePayroll(parsed.data, access.access, access.session.user.id);
      return NextResponse.json({ data });
    } catch (cause) {
      if (cause instanceof PayrollServiceError)
        return apiError(cause.code, cause.message, cause.status, cause.details);
      return apiError('ACTION_FAILED', 'Unable to transition payroll run.', 500);
    }
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return apiError('VALIDATION_FAILED', 'Invalid payroll run.', 422, parsed.error.flatten());
  try {
    const data = await mutatePayroll(
      { action: 'create_run', ...parsed.data },
      access.access,
      access.session.user.id,
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (cause) {
    if (cause instanceof PayrollServiceError)
      return apiError(cause.code, cause.message, cause.status, cause.details);
    return apiError('CREATE_FAILED', 'Unable to create payroll run.', 500);
  }
}
