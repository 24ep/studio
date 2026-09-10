import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { applyPayrollAmountVisibility } from '@/lib/payroll/amount-visibility';
import { payrollActionSchema, payrollResources, type PayrollResource } from '@/lib/payroll/contracts';
import { collectPayrollInputs } from '@/lib/payroll/collect-inputs';
import { getPayrollAccess } from '@/lib/payroll/permissions';
import { rememberPayrollRunType } from '@/lib/payroll/run-type-registry';
import { getPayrollWorkspace, mutatePayroll, PayrollServiceError } from '@/lib/payroll/service';
import { markPayrollSourcesCollected, markPayrollSourcesPaid } from '@/lib/payroll/source-lifecycle';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function responseError(error: unknown) {
  if (error instanceof PayrollServiceError) {
    return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details } }, { status: error.status });
  }
  console.error('[Payroll API] Unexpected failure', error);
  return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Payroll is temporarily unavailable.' } }, { status: 500 });
}

async function context(resourceValue: string) {
  const session = await auth();
  if (!session?.user?.id) return { response: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'User session required.' } }, { status: 401 }) };
  if (!payrollResources.includes(resourceValue as PayrollResource)) return { response: NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Payroll workspace not found.' } }, { status: 404 }) };
  const access = await getPayrollAccess(session.user);
  return { session, access, resource: resourceValue as PayrollResource };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource: resourceValue } = await params;
  const resolved = await context(resourceValue);
  if ('response' in resolved) return resolved.response;
  try {
    const workspace = await getPayrollWorkspace(resolved.resource, resolved.access, request.nextUrl.searchParams.get('companyId'));
    const data = applyPayrollAmountVisibility(workspace, resolved.access.canViewAmounts);
    return NextResponse.json({ data });
  } catch (error) {
    return responseError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource: resourceValue } = await params;
  const resolved = await context(resourceValue);
  if ('response' in resolved) return resolved.response;
  const parsed = payrollActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Invalid payroll action.', details: parsed.error.flatten() } }, { status: 422 });
  }
  try {
    const data = parsed.data.action === 'collect_inputs'
      ? await collectPayrollInputs(parsed.data, resolved.access, resolved.session.user.id)
      : await mutatePayroll(parsed.data, resolved.access, resolved.session.user.id);

    if (parsed.data.action === 'create_run') {
      await rememberPayrollRunType(parsed.data.runType);
    }

    if ('runId' in parsed.data) {
      if (parsed.data.action === 'collect_inputs') {
        await markPayrollSourcesCollected(parsed.data.runId);
      }
      if (parsed.data.action === 'mark_paid') {
        await markPayrollSourcesPaid(parsed.data.runId, parsed.data.paymentReference);
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    return responseError(error);
  }
}
