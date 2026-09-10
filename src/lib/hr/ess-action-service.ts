import { randomUUID } from 'crypto';

import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';
import { getEmployeeForUser } from './ess-service';

async function requireEmployee(userId: string, email?: string | null) {
  const employee = await getEmployeeForUser(userId, email);
  if (!employee) throw new Error('NO_EMPLOYEE');
  return employee;
}

export async function acknowledgeOwnDocument({
  userId,
  email,
  documentId,
  ipAddress,
  userAgent,
}: {
  userId: string;
  email?: string | null;
  documentId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const employee = await requireEmployee(userId, email);
  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_employee_documents"
       SET "acknowledged_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1::uuid AND "employee_id" = $2::uuid
         AND "requires_acknowledgment" = true
       RETURNING *`,
      documentId,
      employee.id,
    );
    if (!rows[0]) return null;
    await tx.$executeRawUnsafe(
      `INSERT INTO "hr_document_acknowledgments"
        ("id", "document_id", "employee_id", "ip_address", "device_metadata", "acknowledged_at")
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT ("document_id", "employee_id")
       DO UPDATE SET "acknowledged_at" = CURRENT_TIMESTAMP,
                     "ip_address" = EXCLUDED."ip_address",
                     "device_metadata" = EXCLUDED."device_metadata"`,
      randomUUID(),
      documentId,
      employee.id,
      ipAddress || null,
      JSON.stringify({ userAgent: userAgent || null }),
    );
    return rows[0];
  });
}

export async function updateOwnPerformance({
  userId,
  email,
  input,
}: {
  userId: string;
  email?: string | null;
  input:
    | { action: 'update_goal'; id: string; progress: number; comment?: string | null; expectedVersion: number }
    | { action: 'submit_self_assessment'; id: string; selfAssessment: string; employeeComments?: string | null; developmentPlan?: string | null; expectedVersion: number }
    | { action: 'acknowledge_review'; id: string; expectedVersion: number };
}) {
  const employee = await requireEmployee(userId, email);
  if (input.action === 'update_goal') {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_performance_goals"
       SET "progress" = $3,
           "comments" = CASE WHEN $4::text IS NULL THEN "comments"
             ELSE "comments" || jsonb_build_array(jsonb_build_object(
               'authorUserId', $5::text, 'comment', $4::text, 'createdAt', CURRENT_TIMESTAMP
             )) END,
           "version" = "version" + 1,
           "updated_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1::uuid AND "employee_id" = $2::uuid AND "version" = $6
         AND "status" IN ('active', 'in_progress')
       RETURNING *`,
      input.id,
      employee.id,
      input.progress,
      input.comment || null,
      userId,
      input.expectedVersion,
    );
    return rows[0] || null;
  }

  if (input.action === 'submit_self_assessment') {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_performance_reviews"
       SET "self_assessment" = $3, "employee_comments" = $4, "development_plan" = $5,
           "status" = 'submitted', "submitted_at" = CURRENT_TIMESTAMP,
           "version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP
       WHERE "id" = $1::uuid AND "employee_id" = $2::uuid AND "version" = $6
         AND "status" IN ('not_started', 'in_progress', 'returned_for_revision')
       RETURNING *`,
      input.id,
      employee.id,
      input.selfAssessment,
      input.employeeComments || null,
      input.developmentPlan || null,
      input.expectedVersion,
    );
    const row = rows[0] || null;
    if (row && employee.manager_id) {
      const managers = await prisma.$queryRawUnsafe<{ user_id: string | null }[]>(
        `SELECT user_id FROM "hr_employees" WHERE id = $1::uuid LIMIT 1`,
        employee.manager_id,
      );
      if (managers[0]?.user_id) {
        await NotificationService.createNotification(managers[0].user_id, {
          type: 'ess_performance_action_required',
          title: 'Self-assessment ready for review',
          message: 'A direct report submitted their self-assessment.',
          data: { href: '/ess/team', reviewId: input.id },
        }, userId).catch(() => null);
      }
    }
    return row;
  }

  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE "hr_performance_reviews"
     SET "status" = 'acknowledged', "acknowledged_at" = CURRENT_TIMESTAMP,
         "version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP
     WHERE "id" = $1::uuid AND "employee_id" = $2::uuid AND "version" = $3
       AND "status" = 'completed'
     RETURNING *`,
    input.id,
    employee.id,
    input.expectedVersion,
  );
  return rows[0] || null;
}
