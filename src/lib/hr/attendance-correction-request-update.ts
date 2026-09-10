import { z } from 'zod';

import prisma from '@/lib/prisma';
import { ATTENDANCE_CORRECTION_TYPES } from './attendance-correction';

const dateTimeValue = z.string().datetime({ offset: true }).or(z.string().datetime());

export const attendanceCorrectionUpdateSchema = z.object({
  id: z.string().uuid(),
  expectedVersion: z.coerce.number().int().positive(),
  title: z.string().min(3).max(140),
  reason: z.string().min(3).max(2000),
  values: z.object({
    workDate: z.string().date(),
    correctionType: z.enum(ATTENDANCE_CORRECTION_TYPES),
    attendanceRecordId: z.string().uuid().optional().nullable(),
    assignmentId: z.string().uuid().optional().nullable(),
    clockIn: dateTimeValue.optional().nullable(),
    clockOut: dateTimeValue.optional().nullable(),
    breakMinutes: z.coerce.number().int().min(0).max(720).optional().nullable(),
    workLocation: z.string().trim().max(120).optional().nullable(),
    requestedStatus: z.string().trim().max(80).optional().nullable(),
  }).refine(
    value => !value.clockIn || !value.clockOut || new Date(value.clockOut) > new Date(value.clockIn),
    { message: 'Check-out must be after check-in.', path: ['clockOut'] },
  ),
  originalValues: z.record(z.string(), z.unknown()).default({}),
  supportingDocuments: z.array(z.object({
    name: z.string().min(1).max(200),
    url: z.string().min(1).max(2048).refine(value => value.startsWith('/') || /^https?:\/\//i.test(value), 'Evidence must be a secure application path or URL.'),
    size: z.string().max(40).optional(),
  })).max(10).default([]),
});

export async function updateOwnAttendanceCorrection({
  userId,
  email,
  input,
}: {
  userId: string;
  email?: string | null;
  input: z.infer<typeof attendanceCorrectionUpdateSchema>;
}) {
  const employees = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "hr_employees"
     WHERE user_id = $1::uuid OR lower(email) = lower($2)
     ORDER BY CASE WHEN user_id = $1::uuid THEN 0 ELSE 1 END LIMIT 1`,
    userId,
    email || '',
  );
  const employee = employees[0];
  if (!employee) throw new Error('NO_EMPLOYEE');

  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE "hr_ess_requests"
     SET title = $4, reason = $5, requested_values = $6::jsonb,
         original_values = $7::jsonb, supporting_documents = $8::jsonb,
         version = version + 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1::uuid AND requester_employee_id = $2::uuid
       AND version = $3 AND request_type = 'attendance_correction'
       AND status IN ('draft', 'returned_for_revision')
     RETURNING *`,
    input.id,
    employee.id,
    input.expectedVersion,
    input.title,
    input.reason,
    JSON.stringify(input.values),
    JSON.stringify(input.originalValues),
    JSON.stringify(input.supportingDocuments),
  );
  if (!rows[0]) {
    const existing = await prisma.$queryRawUnsafe<{ id: string; requester_employee_id: string; version: number; status: string }[]>(
      `SELECT id, requester_employee_id, version, status FROM "hr_ess_requests" WHERE id = $1::uuid LIMIT 1`,
      input.id,
    );
    if (!existing[0]) throw new Error('NOT_FOUND');
    if (existing[0].requester_employee_id !== employee.id) throw new Error('FORBIDDEN');
    if (existing[0].version !== input.expectedVersion) throw new Error('CONFLICT');
    throw new Error('INVALID_TRANSITION');
  }
  return rows[0];
}
