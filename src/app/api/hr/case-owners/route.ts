import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }

  if (!hasAnyPermission(session.user, ['HR_PEOPLE_MANAGE'])) {
    return NextResponse.json({ message: 'Forbidden: HR People Manage permission required.' }, { status: 403 });
  }

  const owners = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { role: 'Admin' },
        { module_permissions: { has: 'HR_PEOPLE_MANAGE' } },
      ],
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ owners, currentUserId: session.user.id });
}
