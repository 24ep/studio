import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { auth } from '@/auth';
import { expenseResources, type ExpenseResource } from '@/lib/expenses/contracts';
import {
  actOnExpense,
  createAdvance,
  createClaim,
  createTravel,
  ExpensePolicyError,
  listExpenseWorkspace,
} from '@/lib/expenses/service';

export const dynamic = 'force-dynamic';

function isExpenseResource(value: string): value is ExpenseResource {
  return expenseResources.includes(value as ExpenseResource);
}

function responseForError(error: unknown) {
  if (error instanceof ExpensePolicyError) {
    return NextResponse.json({
      message: 'This request has policy issues that must be resolved before submission.',
      code: 'POLICY_BLOCKED',
      policyResults: error.results,
    }, { status: 422 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({
      message: 'Please correct the highlighted expense fields.',
      code: 'VALIDATION_FAILED',
      errors: error.flatten(),
    }, { status: 400 });
  }
  const code = error instanceof Error ? error.message : 'UNKNOWN';
  if (code === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user.', code }, { status: 404 });
  if (code === 'FORBIDDEN') return NextResponse.json({ message: 'You do not have access to this expense record.', code }, { status: 403 });
  if (code === 'NOT_FOUND') return NextResponse.json({ message: 'Expense record not found.', code }, { status: 404 });
  if (code === 'CONFLICT') return NextResponse.json({ message: 'This record changed while you were viewing it. Refresh and try again.', code }, { status: 409 });
  if (code === 'COMMENT_REQUIRED') return NextResponse.json({ message: 'A reason is required for this action.', code }, { status: 400 });
  if (code === 'INVALID_TRANSITION') return NextResponse.json({ message: 'This action is no longer available for the record.', code }, { status: 409 });
  if (code === 'MIGRATION_REQUIRED') return NextResponse.json({
    message: 'Expenses is ready, but its database migration has not been applied.',
    code,
  }, { status: 503 });
  return NextResponse.json({
    message: 'We could not process the expense request. Try again or contact Finance.',
    code: 'EXPENSE_REQUEST_FAILED',
  }, { status: 500 });
}

async function requestContext(resourceValue: string) {
  if (!isExpenseResource(resourceValue)) {
    return { response: NextResponse.json({ message: 'Expense resource not found.' }, { status: 404 }) };
  }
  const session = await auth();
  if (!session?.user?.id) {
    return { response: NextResponse.json({ message: 'Authentication required.' }, { status: 401 }) };
  }
  return { resource: resourceValue, session: session.user };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource: resourceValue } = await params;
  const context = await requestContext(resourceValue);
  if ('response' in context) return context.response;
  try {
    const page = Number(request.nextUrl.searchParams.get('page') || 1);
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || 50);
    const data = await listExpenseWorkspace({
      resource: context.resource,
      session: context.session,
      scope: request.nextUrl.searchParams.get('scope'),
      search: request.nextUrl.searchParams.get('search'),
      status: request.nextUrl.searchParams.get('status'),
      page,
      pageSize,
    });
    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Vary': 'Cookie',
      },
    });
  } catch (error) {
    return responseForError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource: resourceValue } = await params;
  const context = await requestContext(resourceValue);
  if ('response' in context) return context.response;
  const body = await request.json().catch(() => null);
  try {
    if (context.resource === 'advances') {
      return NextResponse.json({ data: await createAdvance(context.session, body) }, { status: 201 });
    }
    if (context.resource === 'claims') {
      return NextResponse.json({ data: await createClaim(context.session, body) }, { status: 201 });
    }
    if (context.resource === 'travel') {
      return NextResponse.json({ data: await createTravel(context.session, body) }, { status: 201 });
    }
    return NextResponse.json({ message: 'Accounting entries are generated from approved source transactions.' }, { status: 405 });
  } catch (error) {
    return responseForError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource: resourceValue } = await params;
  const context = await requestContext(resourceValue);
  if ('response' in context) return context.response;
  try {
    const data = await actOnExpense(
      context.resource,
      context.session,
      await request.json().catch(() => null),
    );
    return NextResponse.json({ data });
  } catch (error) {
    return responseForError(error);
  }
}
