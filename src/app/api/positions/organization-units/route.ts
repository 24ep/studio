import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { listOrganizationNodes } from '@/lib/hr/organization-hierarchy';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'POSITIONS_CREATE')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const nodes = await prisma.$transaction(tx => listOrganizationNodes(tx));
  return NextResponse.json({
    units: nodes.filter(node => node.isActive).map(({ id, name, parentId, unitType }) => ({
      id,
      name,
      parentId,
      unitType,
    })),
  });
}
