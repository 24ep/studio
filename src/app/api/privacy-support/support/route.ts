import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { consumeSubmission, employeeContext, requestNumber } from '@/lib/privacy-support';
import { handlePrivacySupportApi } from '@/lib/privacy-support-api';
import {
  canRequesterReply,
  canRequesterWithdraw,
  nextTicketStatus,
  requesterActionSchema,
  supportCreateSchema,
} from '@/lib/service-desk-contract';
import { logAudit } from '@/lib/auditLog';
import { updateHrisTaskProjectionStatus } from '@/lib/hris/task-projection';
import { isActiveServiceDeskCategory } from '@/lib/service-desk-categories';

async function listRequests() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const requests = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT r.id, r.requester_user_id AS "requesterId", r.request_number AS "requestNumber", r.category, r.subject, r.description,
            r.status, r.priority, r.submitted_at AS "submittedAt", r.updated_at AS "updatedAt",
            r.resolved_at AS "resolvedAt",
            COALESCE((
              SELECT json_agg(json_build_object(
                'id', activity.id,
                'action', activity.action,
                'message', activity.message,
                'createdAt', activity.created_at,
                'actorId', activity.actor_user_id,
                'actor', actor.name
              ) ORDER BY activity.created_at, activity.id)
              FROM employee_support_activities activity
              LEFT JOIN "User" actor ON actor.id = activity.actor_user_id
              WHERE activity.request_id = r.id AND activity.visibility = 'requester'
            ), '[]'::json) AS activities
       FROM employee_support_requests r
      WHERE r.requester_user_id = $1::uuid
      ORDER BY r.updated_at DESC, r.created_at DESC
      LIMIT 200`,
    session.user.id,
  );
  return NextResponse.json({ requests });
}

async function createRequest(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const parsed = supportCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please correct the highlighted fields.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const employee = await employeeContext(session.user);
  if (!(await isActiveServiceDeskCategory(employee.companyId, parsed.data.category))) {
    return NextResponse.json({ message: 'Choose an active service desk category.' }, { status: 400 });
  }
  if (!consumeSubmission(session.user.id)) {
    return NextResponse.json(
      { message: 'You have reached the hourly request limit. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    );
  }

  const number = requestNumber('SUP');
  const rows = await prisma.$transaction(async transaction => {
    const created = await transaction.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO employee_support_requests
        (id, request_number, requester_user_id, employee_id, company_id,
         category, subject, description, metadata, updated_at)
       VALUES (gen_random_uuid(), $1, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8::jsonb, now())
       RETURNING id`,
      number,
      session.user.id,
      employee.id,
      employee.companyId,
      parsed.data.category,
      parsed.data.subject,
      parsed.data.description,
      JSON.stringify(parsed.data.metadata || {}),
    );
    await transaction.$executeRawUnsafe(
      `INSERT INTO employee_support_activities (id, request_id, actor_user_id, action, message, visibility)
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'submitted', 'Request submitted', 'requester')`,
      created[0].id,
      session.user.id,
    );
    return created;
  });
  await logAudit('AUDIT', 'Employee support request submitted.', 'API:PrivacySupport:Support', session.user.id, {
    requestId: rows[0].id,
    requestNumber: number,
  });
  return NextResponse.json({ id: rows[0].id, requestNumber: number }, { status: 201 });
}

async function updateRequest(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const parsed = requesterActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid request action.' }, { status: 400 });
  const data = parsed.data;
  if (data.action === 'reply' && !data.message) {
    return NextResponse.json({ message: 'A reply is required.' }, { status: 400 });
  }

  const owned = await prisma.$queryRawUnsafe<{ status: string }[]>(
    `SELECT status FROM employee_support_requests
      WHERE id = $1::uuid AND requester_user_id = $2::uuid`,
    data.requestId,
    session.user.id,
  );
  if (!owned[0]) return NextResponse.json({ message: 'Request not found.' }, { status: 404 });
  const allowed = data.action === 'withdraw'
    ? canRequesterWithdraw(owned[0].status)
    : canRequesterReply(owned[0].status);
  if (!allowed) {
    return NextResponse.json({ message: 'This ticket can no longer be changed.' }, { status: 409 });
  }

  const nextStatus = nextTicketStatus('requester', data.action);
  await prisma.$transaction(async transaction => {
    await transaction.$executeRawUnsafe(
      `UPDATE employee_support_requests
          SET status = $1, updated_at = now()
        WHERE id = $2::uuid AND requester_user_id = $3::uuid`,
      nextStatus,
      data.requestId,
      session.user.id,
    );
    await transaction.$executeRawUnsafe(
      `INSERT INTO employee_support_activities
        (id, request_id, actor_user_id, action, message, visibility)
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, 'requester')`,
      data.requestId,
      session.user.id,
      data.action === 'withdraw' ? 'withdrawn' : 'reply',
      data.message || (data.action === 'withdraw' ? 'Request withdrawn by employee' : null),
    );
    await updateHrisTaskProjectionStatus({
      sourceDomain: 'service_desk',
      sourceType: 'employee_support_request',
      sourceId: data.requestId,
      status: data.action === 'withdraw' ? 'cancelled' : 'pending',
      client: transaction,
    });
  });
  await logAudit('AUDIT', `Employee support request ${data.action === 'withdraw' ? 'withdrawn' : 'replied to'}.`, 'API:PrivacySupport:Support', session.user.id, {
    requestId: data.requestId,
    action: data.action,
  });
  return NextResponse.json({ success: true });
}

export function GET() {
  return handlePrivacySupportApi('Loading employee support requests', listRequests);
}

export function POST(request: NextRequest) {
  return handlePrivacySupportApi('Creating an employee support request', () => createRequest(request));
}

export function PATCH(request: NextRequest) {
  return handlePrivacySupportApi('Updating an employee support request', () => updateRequest(request));
}
