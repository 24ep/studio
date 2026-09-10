import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { getHrCrudRecord } from '@/lib/hr/hr-crud';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const profileSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  preferredName: z.string().trim().nullable(),
  email: z.string().trim().email(),
  phone: z.string().trim().nullable(),
  location: z.string().trim().nullable(),
  introduction: z.string().trim().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  const { id } = await params;
  const canManagePeople = hasAnyPermission(session.user, ['HR_PEOPLE_MANAGE'] as PlatformModuleId[]);
  const currentEmployee = canManagePeople
    ? null
    : await getEmployeeForUser(session.user.id, session.user.email);
  if (!canManagePeople && currentEmployee?.id !== id) {
    return NextResponse.json({ message: 'Forbidden: Insufficient HR people permission.' }, { status: 403 });
  }

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Enter valid person profile details.' }, { status: 400 });
  const found = await prisma.employee.findUnique({ where: { id }, select: { id: true, personProfileId: true } });
  if (!found) return NextResponse.json({ message: 'Employee not found.' }, { status: 404 });

  await prisma.$transaction(async tx => {
    const data = parsed.data;
    if (found.personProfileId) {
      await tx.personProfile.update({ where: { id: found.personProfileId }, data });
    } else {
      const profile = await tx.personProfile.create({ data });
      await tx.employee.update({ where: { id }, data: { personProfileId: profile.id } });
    }
    await tx.employee.update({
      where: { id },
      data: { firstName: data.firstName, lastName: data.lastName, preferredName: data.preferredName },
    });
  });

  await logAudit('AUDIT', 'Employee person profile updated.', 'API:HR:Employees:PersonProfile:Update', session.user.id, { employeeId: id });
  return NextResponse.json({ data: await getHrCrudRecord('people', id) });
}
