import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VIEW = ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE'] as PlatformModuleId[];
const MANAGE = ['HR_WORKFORCE_MANAGE'] as PlatformModuleId[];
const assignmentSchema = z.object({
  employeeId: z.string().uuid(),
  mode: z.enum(['company_bus', 'van', 'car_allowance', 'shuttle']),
  route: z.string().trim().min(1).max(160),
  pickupPoint: z.string().trim().max(240).nullable().optional(),
  pickupTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  vehicle: z.string().trim().max(120).nullable().optional(),
  status: z.enum(['active', 'paused']),
});
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), data: assignmentSchema }),
  z.object({ action: z.literal('update'), id: z.string().uuid(), data: assignmentSchema }),
  z.object({ action: z.literal('set_status'), id: z.string().uuid(), status: z.enum(['active', 'paused']) }),
  z.object({ action: z.literal('delete'), id: z.string().uuid() }),
]);

type Row = { id: string; employeeId: string; employee: string; employeeNumber: string; department: string | null; mode: string; route: string; pickupPoint: string | null; pickupTime: string | null; vehicle: string | null; status: string };

async function listAssignments() {
  return prisma.$queryRaw<Row[]>`
    SELECT a.id, a.employee_id AS "employeeId",
      CONCAT_WS(' ', NULLIF(e.preferred_name, ''), CASE WHEN e.preferred_name IS NULL OR e.preferred_name = '' THEN e.first_name ELSE NULL END, CASE WHEN e.preferred_name IS NULL OR e.preferred_name = '' THEN e.last_name ELSE NULL END) AS employee,
      e.employee_number AS "employeeNumber", COALESCE(d.name, d.department) AS department,
      a.mode, a.route, a.pickup_point AS "pickupPoint", TO_CHAR(a.pickup_time, 'HH24:MI') AS "pickupTime",
      a.vehicle, a.status
    FROM hr_transportation_assignments a
    JOIN hr_employees e ON e.id = a.employee_id
    LEFT JOIN hr_departments d ON d.id = e.department_id
    ORDER BY a.updated_at DESC`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  if (!hasAnyPermission(session.user, VIEW)) return NextResponse.json({ message: 'Forbidden: Insufficient Workforce permission.' }, { status: 403 });
  return NextResponse.json({ assignments: await listAssignments() });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  if (!hasAnyPermission(session.user, MANAGE)) return NextResponse.json({ message: 'Forbidden: Workforce manage permission required.' }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid transportation request.', errors: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  try {
    if (input.action === 'create' || input.action === 'update') {
      const value = input.data;
      if (input.action === 'create') {
        await prisma.$executeRaw`INSERT INTO hr_transportation_assignments (employee_id, mode, route, pickup_point, pickup_time, vehicle, status, created_by_id, updated_by_id) VALUES (${value.employeeId}::uuid, ${value.mode}, ${value.route}, ${value.pickupPoint || null}, ${value.pickupTime || null}::time, ${value.vehicle || null}, ${value.status}, ${session.user.id}::uuid, ${session.user.id}::uuid)`;
      } else {
        await prisma.$executeRaw`UPDATE hr_transportation_assignments SET employee_id=${value.employeeId}::uuid, mode=${value.mode}, route=${value.route}, pickup_point=${value.pickupPoint || null}, pickup_time=${value.pickupTime || null}::time, vehicle=${value.vehicle || null}, status=${value.status}, updated_by_id=${session.user.id}::uuid, updated_at=NOW() WHERE id=${input.id}::uuid`;
      }
    } else if (input.action === 'set_status') {
      await prisma.$executeRaw`UPDATE hr_transportation_assignments SET status=${input.status}, updated_by_id=${session.user.id}::uuid, updated_at=NOW() WHERE id=${input.id}::uuid`;
    } else {
      await prisma.$executeRaw`DELETE FROM hr_transportation_assignments WHERE id=${input.id}::uuid`;
    }
    await logAudit('AUDIT', `Transportation assignment ${input.action} completed.`, `API:HR:Transportation:${input.action}`, session.user.id, { action: input.action, entity: 'transportation_assignment', entityId: 'id' in input ? input.id : input.data.employeeId });
    return NextResponse.json({ assignments: await listAssignments() });
  } catch (error) {
    const message = error instanceof Error && error.message.includes('hr_transportation_employee_uq') ? 'This employee already has a transportation assignment.' : 'Transportation assignment could not be saved.';
    return NextResponse.json({ message }, { status: 409 });
  }
}
