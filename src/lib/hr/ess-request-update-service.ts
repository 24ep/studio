import { randomUUID } from 'crypto';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { essRequestUpdateSchema } from './ess-contracts';
import { getEmployeeForUser } from './ess-service';

export type EssRequestUpdateInput = z.infer<typeof essRequestUpdateSchema>;

export async function updateOwnEssRequest(
  userId: string,
  email: string | null | undefined,
  input: EssRequestUpdateInput,
) {
  const employee = await getEmployeeForUser(userId, email);
  if (!employee) throw new Error('NO_EMPLOYEE');

  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Array<{
      id: string;
      request_type: string;
      status: string;
      version: number;
    }>>(
      `SELECT id, request_type, status, version
         FROM "hr_ess_requests"
        WHERE id = $1::uuid AND requester_employee_id = $2::uuid
        LIMIT 1
        FOR UPDATE`,
      input.id,
      employee.id,
    );
    const current = rows[0];
    if (!current) throw new Error('NOT_FOUND');
    if (current.request_type !== input.requestType) throw new Error('FORBIDDEN');
    if (!['draft', 'returned_for_revision'].includes(current.status)) throw new Error('INVALID_TRANSITION');
    if (Number(current.version) !== input.expectedVersion) throw new Error('CONFLICT');

    const updated = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE "hr_ess_requests"
          SET title = $2,
              reason = $3,
              requested_values = $4::jsonb,
              version = version + 1,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::uuid AND version = $5
        RETURNING *`,
      input.id,
      input.title,
      input.reason,
      JSON.stringify(input.values),
      input.expectedVersion,
    );
    if (!updated[0]) throw new Error('CONFLICT');

    await tx.$executeRawUnsafe(
      `INSERT INTO "hr_ess_request_activities"
        (id, request_id, actor_user_id, action, from_status, to_status, comment, created_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, 'revised', $4, $4, 'Employee updated the returned request.', CURRENT_TIMESTAMP)`,
      randomUUID(),
      input.id,
      userId,
      current.status,
    );
    return updated[0];
  });
}
