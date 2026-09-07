import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';
import { essRequestActionSchema, essRequestCreateSchema, essRequestUpdateSchema } from '@/lib/hr/ess-contracts';
import {
  attendanceCorrectionUpdateSchema,
  updateOwnAttendanceCorrection,
} from '@/lib/hr/attendance-correction-request-update';
import {
  actOnEssRequest,
  createEssRequest,
  listManagerEssApprovals,
  listOwnEssRequests,
} from '@/lib/hr/ess-request-service';
import { updateOwnEssRequest } from '@/lib/hr/ess-request-update-service';

function errorResponse(error: unknown) {
  const code = error instanceof Error ? error.message : 'UNKNOWN';
  if (code === 'NO_EMPLOYEE') return NextResponse.json({ message: 'No employee record is linked to this user.' }, { status: 404 });
  if (code === 'NOT_FOUND') return NextResponse.json({ message: 'Request not found.' }, { status: 404 });
  if (code === 'FORBIDDEN') return NextResponse.json({ message: 'You do not have access to this request.' }, { status: 403 });
  if (code === 'CONFLICT') return NextResponse.json({ message: 'This request changed while you were viewing it. Reload and try again.' }, { status: 409 });
  if (code === 'COMMENT_REQUIRED') return NextResponse.json({ message: 'A comment is required for this decision.' }, { status: 400 });
  if (code === 'INVALID_TRANSITION') return NextResponse.json({ message: 'This action is no longer available for the request.' }, { status: 409 });
  return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to process request.' }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  try {
    const manager = request.nextUrl.searchParams.get('scope') === 'manager';
    const data = manager
      ? await listManagerEssApprovals(session.user.id, session.user.email)
      : await listOwnEssRequests(session.user.id, session.user.email);
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  const parsed = essRequestCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Please correct the highlighted request fields.', errors: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const data = await createEssRequest(session.user.id, session.user.email, parsed.data);
    await logAudit('AUDIT', `ESS ${parsed.data.requestType} request created.`, 'API:ESS:Request:Create', session.user.id, {
      requestId: data.id,
      status: data.status,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { requestType?: unknown } | null;

  if (body?.requestType === 'profile_change' || body?.requestType === 'document_request') {
    const parsed = essRequestUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Please correct the revised request fields.', errors: parsed.error.flatten() }, { status: 400 });
    }
    try {
      const data = await updateOwnEssRequest(session.user.id, session.user.email, parsed.data);
      await logAudit('AUDIT', `ESS ${parsed.data.requestType} request revised.`, 'API:ESS:Request:Update', session.user.id, {
        requestId: parsed.data.id,
      });
      return NextResponse.json({ data });
    } catch (error) {
      return errorResponse(error);
    }
  }

  const parsed = attendanceCorrectionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Please correct the attendance correction fields.', errors: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const data = await updateOwnAttendanceCorrection({ userId: session.user.id, email: session.user.email, input: parsed.data });
    await logAudit('AUDIT', 'ESS attendance correction updated.', 'API:ESS:AttendanceCorrection:Update', session.user.id, {
      requestId: parsed.data.id,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  const parsed = essRequestActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request action.', errors: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const privileged = hasAnyPermission(session.user, ['HR_PEOPLE_MANAGE', 'HR_WORKFORCE_MANAGE', 'HR_PERFORMANCE_MANAGE']);
    const data = await actOnEssRequest({
      userId: session.user.id,
      email: session.user.email,
      ...parsed.data,
      privileged,
    });
    await logAudit('AUDIT', `ESS request ${parsed.data.action}.`, 'API:ESS:Request:Action', session.user.id, {
      requestId: parsed.data.id,
      action: parsed.data.action,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
