import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { employeeContext, isPrivacySupportAdmin } from '@/lib/privacy-support';
import { logAudit } from '@/lib/auditLog';
import { handlePrivacySupportApi } from '@/lib/privacy-support-api';
import { canHrAct, hrActionSchema, nextTicketStatus } from '@/lib/service-desk-contract';
import { upsertHrisTaskProjection } from '@/lib/hris/task-projection';
import { isAdminUser } from '@/lib/permissions';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isPrivacySupportAdmin(session.user)) return null;
  const employee = await employeeContext(session.user);
  return { ...session.user, companyId: employee.companyId, canViewAllCategories: isAdminUser(session.user) };
}

async function getRequests() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const support = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT r.id, r.requester_user_id AS "requesterId", r.request_number AS "requestNumber", r.category, r.subject, r.description,
            r.status, r.priority, r.submitted_at AS "submittedAt", r.updated_at AS "updatedAt",
            r.resolved_at AS "resolvedAt", u.name AS requester, u.email AS "requesterEmail",
            assignee.name AS assignee,
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
              WHERE activity.request_id = r.id
            ), '[]'::json) AS activities
       FROM employee_support_requests r
       JOIN "User" u ON u.id = r.requester_user_id
       LEFT JOIN "User" assignee ON assignee.id = r.assigned_to_user_id
      WHERE ($1::uuid IS NULL OR r.company_id = $1::uuid)
        AND (
          $2::boolean
          OR NOT EXISTS (
            SELECT 1 FROM service_desk_categories configured
             WHERE configured.company_id IS NOT DISTINCT FROM $1::uuid
          )
          OR EXISTS (
            SELECT 1
              FROM service_desk_categories configured
              JOIN service_desk_category_assignees assignment ON assignment.category_id = configured.id
             WHERE configured.company_id IS NOT DISTINCT FROM $1::uuid
               AND configured.key = r.category
               AND assignment.user_id = $3::uuid
          )
        )
      ORDER BY r.updated_at DESC, r.created_at DESC
      LIMIT 200`,
    user.companyId,
    user.canViewAllCategories,
    user.id,
  );
  return NextResponse.json({ support });
}

async function updateRequest(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const parsed = hrActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid request update.' }, { status: 400 });
  const data = parsed.data;
  if (data.action === 'reply' && !data.message) {
    return NextResponse.json({ message: 'A reply is required.' }, { status: 400 });
  }

  const tickets = await prisma.$queryRawUnsafe<Array<{
    id: string;
    status: string;
    companyId: string | null;
    subject: string;
    requestNumber: string;
    category: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    requesterUserId: string;
    requesterName: string;
  }>>(
    `SELECT r.id, r.status, r.company_id AS "companyId", r.subject,
            r.request_number AS "requestNumber", r.category, r.priority,
            r.requester_user_id AS "requesterUserId", requester.name AS "requesterName"
       FROM employee_support_requests r
       JOIN "User" requester ON requester.id = r.requester_user_id
      WHERE r.id = $1::uuid
        AND ($2::uuid IS NULL OR r.company_id = $2::uuid)
        AND (
          $3::boolean
          OR NOT EXISTS (
            SELECT 1 FROM service_desk_categories configured
             WHERE configured.company_id IS NOT DISTINCT FROM $2::uuid
          )
          OR EXISTS (
            SELECT 1
              FROM service_desk_categories configured
              JOIN service_desk_category_assignees assignment ON assignment.category_id = configured.id
             WHERE configured.company_id IS NOT DISTINCT FROM $2::uuid
               AND configured.key = r.category
               AND assignment.user_id = $4::uuid
          )
        )`,
    data.requestId,
    user.companyId,
    user.canViewAllCategories,
    user.id,
  );
  const ticket = tickets[0];
  if (!ticket) return NextResponse.json({ message: 'Ticket not found.' }, { status: 404 });
  if (!canHrAct(ticket.status)) {
    return NextResponse.json({ message: 'This ticket can no longer be changed.' }, { status: 409 });
  }

  const nextStatus = nextTicketStatus('hr', data.action);
  const historyMessage = data.message || 'Ticket closed by HR';
  await prisma.$transaction(async transaction => {
    await transaction.$executeRawUnsafe(
      `UPDATE employee_support_requests
          SET status = $1,
              assigned_to_user_id = COALESCE(assigned_to_user_id, $2::uuid),
              resolved_at = CASE WHEN $1 = 'closed' THEN now() ELSE NULL END,
              updated_at = now()
        WHERE id = $3::uuid AND ($4::uuid IS NULL OR company_id = $4::uuid)`,
      nextStatus,
      user.id,
      data.requestId,
      user.companyId,
    );
    await transaction.$executeRawUnsafe(
      `INSERT INTO employee_support_activities
        (id, request_id, actor_user_id, action, message, visibility)
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, 'requester')`,
      data.requestId,
      user.id,
      data.action === 'close' ? 'closed' : 'reply',
      historyMessage,
    );
    await upsertHrisTaskProjection({
      companyId: ticket.companyId,
      taskType: 'service_desk_case',
      sourceDomain: 'service_desk',
      sourceType: 'employee_support_request',
      sourceId: ticket.id,
      subject: ticket.subject,
      summary: `${ticket.requestNumber} · ${ticket.category}`,
      requesterUserId: ticket.requesterUserId,
      requesterName: ticket.requesterName,
      assigneeUserId: user.id,
      assigneeName: user.name,
      priority: ticket.priority,
      status: data.action === 'close' ? 'completed' : 'in_progress',
      deepLink: `/service-desk?ticket=${ticket.id}`,
      allowedDecisions: [],
      decisionHandlers: {},
    }, transaction);
  });
  await logAudit('AUDIT', `Support ticket ${data.action === 'close' ? 'closed' : 'replied to'}.`, 'API:PrivacySupport:Admin:Requests', user.id, {
    requestId: data.requestId,
    action: data.action,
    companyId: ticket.companyId,
  });
  return NextResponse.json({ success: true });
}

export function GET() {
  return handlePrivacySupportApi('Loading the service desk', getRequests);
}

export function PATCH(request: NextRequest) {
  return handlePrivacySupportApi('Updating a service desk request', () => updateRequest(request));
}
