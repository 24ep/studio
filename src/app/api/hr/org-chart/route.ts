import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { assertAllocationCanBeSaved } from '@/lib/hr/organization-headcount-allocation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const nullableUuid = z.string().uuid().nullable();

const updateSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('employee'),
    id: z.string().uuid(),
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.string().trim().email(),
    jobTitle: z.string().trim().nullable(),
    status: z.enum(['active', 'inactive', 'onboarding', 'probation']),
    location: z.string().trim().nullable(),
    managerId: nullableUuid,
    departmentId: nullableUuid,
  }),
  z.object({
    type: z.literal('division'),
    id: z.string().uuid(),
    currentName: z.string().trim().min(1),
    name: z.string().trim().min(1),
    headcountAllocation: z.number().int().min(0).nullable(),
  }),
  z.object({
    type: z.literal('department'),
    id: z.string().uuid(),
    division: z.string().trim().min(1),
    currentName: z.string().trim().min(1),
    name: z.string().trim().min(1),
    headcountAllocation: z.number().int().min(0).nullable(),
  }),
]);

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!hasPermission(session.user, 'HR_PEOPLE_MANAGE')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR people permission.' }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid organization chart update.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;
  try {
    if (input.type === 'employee') {
      if (input.managerId === input.id) {
        return NextResponse.json({ message: 'An employee cannot be their own manager.' }, { status: 400 });
      }

      if (input.managerId) {
        const cycle = await prisma.$queryRaw<Array<{ id: string }>>`
          WITH RECURSIVE reports AS (
            SELECT id FROM hr_employees WHERE manager_id = ${input.id}::uuid
            UNION ALL
            SELECT employee.id
            FROM hr_employees employee
            INNER JOIN reports report ON employee.manager_id = report.id
          )
          SELECT id FROM reports WHERE id = ${input.managerId}::uuid LIMIT 1
        `;
        if (cycle.length > 0) {
          return NextResponse.json({ message: 'That reporting line would create a circular hierarchy.' }, { status: 400 });
        }
      }

      const employees = await prisma.$queryRaw<Array<{ id: string }>>`
        UPDATE hr_employees
        SET
          first_name = ${input.firstName},
          last_name = ${input.lastName},
          email = ${input.email},
          job_title = ${input.jobTitle || null},
          status = ${input.status},
          location = ${input.location || null},
          manager_id = ${input.managerId}::uuid,
          department_id = ${input.departmentId}::uuid,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${input.id}::uuid
        RETURNING id
      `;
      const employee = employees[0];
      if (!employee) {
        return NextResponse.json({ message: 'Employee not found.' }, { status: 404 });
      }
      await logAudit(
        'AUDIT',
        'Employee updated from organization chart.',
        'API:HR:OrgChart:EmployeeUpdate',
        session.user.id,
        { employeeId: employee.id },
      );
      return NextResponse.json({ data: employee });
    }

    const result = await prisma.$transaction(async (tx) => {
      await assertAllocationCanBeSaved(tx, input.id, input.headcountAllocation);
      await tx.$executeRaw`
        UPDATE hr_departments
        SET headcount_allocation = ${input.headcountAllocation}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${input.id}::uuid
      `;
      if (input.type === 'division') {
        const rows = await tx.$queryRaw<Array<{ count: bigint }>>`
          WITH updated AS (
            UPDATE hr_departments
            SET division = ${input.name}, updated_at = CURRENT_TIMESTAMP
            WHERE division = ${input.currentName}
            RETURNING id
          )
          SELECT COUNT(*)::bigint AS count FROM updated
        `;
        return { departments: Number(rows[0]?.count || 0) };
      }

      const departmentRows = await tx.$queryRaw<Array<{ count: bigint }>>`
        WITH updated AS (
          UPDATE hr_departments
          SET department = ${input.name}, updated_at = CURRENT_TIMESTAMP
          WHERE division = ${input.division} AND department = ${input.currentName}
          RETURNING id
        )
        SELECT COUNT(*)::bigint AS count FROM updated
      `;
      const positionRows = await tx.$queryRaw<Array<{ count: bigint }>>`
        WITH updated AS (
          UPDATE "Position"
          SET department = ${input.name}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE department = ${input.currentName}
          RETURNING id
        )
        SELECT COUNT(*)::bigint AS count FROM updated
      `;
      return {
        departments: Number(departmentRows[0]?.count || 0),
        positions: Number(positionRows[0]?.count || 0),
      };
    });

    await logAudit(
      'AUDIT',
      `${input.type === 'division' ? 'Division' : 'Department'} renamed from organization chart.`,
      `API:HR:OrgChart:${input.type === 'division' ? 'Division' : 'Department'}Update`,
      session.user.id,
      { ...input, result },
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[HR:OrgChart] Update failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to update organization chart.' },
      { status: error instanceof Error && error.message.startsWith('Headcount allocation') ? 400 : 500 },
    );
  }
}
