import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { consumeSubmission, employeeContext, requestNumber } from '@/lib/privacy-support';
import { logAudit } from '@/lib/auditLog';
import { handlePrivacySupportApi } from '@/lib/privacy-support-api';

const schema = z.object({
  details: z.string().trim().min(20).max(5000),
  scope: z.array(z.enum(['account', 'profile', 'documents', 'activity', 'other'])).min(1),
  identityConfirmed: z.literal(true),
});

async function getRequests() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const requests = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT id, request_number AS "requestNumber", status, details, scope,
            due_at AS "dueAt", submitted_at AS "submittedAt", completed_at AS "completedAt",
            withdrawn_at AS "withdrawnAt"
       FROM hr_privacy_requests
      WHERE requester_user_id = $1::uuid AND request_type = 'deletion'
      ORDER BY created_at DESC`,
    session.user.id,
  );
  return NextResponse.json({ requests });
}

export function GET() {
  return handlePrivacySupportApi('Loading deletion requests', getRequests);
}

async function createRequest(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!consumeSubmission(session.user.id, 3, 24 * 60 * 60 * 1000)) return NextResponse.json({ message: 'Too many privacy requests. Please try again later.' }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Please complete all required fields.', errors: parsed.error.flatten() }, { status: 400 });
  const employee = await employeeContext(session.user);
  if (!employee.id) return NextResponse.json({ message: 'No employee record is linked to this account.' }, { status: 404 });
  const number = requestNumber('PRV');
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO hr_privacy_requests
      (id, company_id, employee_id, request_type, status, due_at, scope, request_number,
       requester_user_id, details, identity_confirmed, submitted_at)
     VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'deletion', 'submitted',
       now() + interval '30 days', $3::jsonb, $4, $5::uuid, $6, true, now())
     RETURNING id`,
    employee.companyId, employee.id, JSON.stringify({ areas: parsed.data.scope }), number, session.user.id, parsed.data.details,
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO hr_privacy_request_activities (id, request_id, actor_user_id, action, message)
     VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'submitted', 'Deletion request submitted')`,
    rows[0].id, session.user.id,
  );
  await logAudit('AUDIT', 'Employee data deletion request submitted.', 'API:PrivacySupport:Privacy', session.user.id, { requestId: rows[0].id, requestNumber: number });
  return NextResponse.json({ id: rows[0].id, requestNumber: number }, { status: 201 });
}

export function POST(request: NextRequest) {
  return handlePrivacySupportApi('Creating a deletion request', () => createRequest(request));
}

async function updateRequest(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const body = z.object({ requestId: z.string().uuid(), message: z.string().trim().max(3000).optional(), action: z.enum(['reply', 'withdraw']) }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  const rows = await prisma.$queryRawUnsafe<{ status: string }[]>(
    `SELECT status FROM hr_privacy_requests WHERE id = $1::uuid AND requester_user_id = $2::uuid`,
    body.data.requestId, session.user.id,
  );
  if (!rows[0]) return NextResponse.json({ message: 'Request not found' }, { status: 404 });
  if (body.data.action === 'withdraw') {
    if (!['submitted', 'received', 'in_review', 'action_required'].includes(rows[0].status)) return NextResponse.json({ message: 'This request can no longer be withdrawn' }, { status: 409 });
    await prisma.$executeRawUnsafe(`UPDATE hr_privacy_requests SET status = 'withdrawn', withdrawn_at = now(), updated_at = now() WHERE id = $1::uuid`, body.data.requestId);
  } else if (!body.data.message) return NextResponse.json({ message: 'A reply is required' }, { status: 400 });
  await prisma.$executeRawUnsafe(
    `INSERT INTO hr_privacy_request_activities (id, request_id, actor_user_id, action, message)
     VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4)`,
    body.data.requestId, session.user.id, body.data.action, body.data.message || null,
  );
  return NextResponse.json({ success: true });
}

export function PATCH(request: NextRequest) {
  return handlePrivacySupportApi('Updating a deletion request', () => updateRequest(request));
}
