import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import {
  createOrganizationNode,
  moveOrganizationNode,
  ORGANIZATION_UNIT_TYPES,
  previewNextOrganizationCode,
  updateOrganizationNode,
} from '@/lib/hr/organization-hierarchy';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';
import { assertAllocationCanBeSaved } from '@/lib/hr/organization-headcount-allocation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const editableFields = {
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  headcountAllocation: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
};

const createSchema = z.object({
  ...editableFields,
  unitType: z.enum(ORGANIZATION_UNIT_TYPES),
  parentId: z.string().uuid().nullable().optional(),
});

const updateSchema = z.object({
  action: z.literal('update'),
  id: z.string().uuid(),
  ...editableFields,
});

const moveSchema = z.object({
  action: z.literal('move'),
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  index: z.number().int().min(0),
});

function canManage(user: Parameters<typeof hasAnyPermission>[0]) {
  return hasAnyPermission(user, ['HR_PEOPLE_MANAGE'] as PlatformModuleId[]);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const parsed = z.object({
    unitType: z.enum(ORGANIZATION_UNIT_TYPES),
    parentId: z.string().uuid().nullable().optional(),
  }).safeParse({
    unitType: request.nextUrl.searchParams.get('unitType'),
    parentId: request.nextUrl.searchParams.get('parentId') || null,
  });
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid code preview request' }, { status: 400 });
  }

  try {
    const code = await prisma.$transaction(tx => previewNextOrganizationCode(tx, parsed.data));
    return NextResponse.json({ code });
  } catch (error) {
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'Failed to generate organization code',
    }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid organization unit', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const data = await prisma.$transaction(tx => createOrganizationNode(tx, parsed.data));
    await logAudit('AUDIT', `Organization ${parsed.data.unitType} created.`, 'API:HR:OrganizationHierarchy:Create', session.user.id, { id: data.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to create organization unit' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const move = moveSchema.safeParse(body);
  const update = updateSchema.safeParse(body);
  if (!move.success && !update.success) {
    return NextResponse.json({ message: 'Invalid hierarchy update' }, { status: 400 });
  }

  try {
    if (move.success) {
      await prisma.$transaction(tx => moveOrganizationNode(tx, move.data));
      await logAudit('AUDIT', 'Organization hierarchy updated.', 'API:HR:OrganizationHierarchy:Move', session.user.id, move.data);
      return NextResponse.json({ message: 'Organization hierarchy updated.' });
    }

    if (!update.success) {
      return NextResponse.json({ message: 'Invalid hierarchy update' }, { status: 400 });
    }
    const { id, action: _action, ...values } = update.data;
    const data = await prisma.$transaction(async tx => {
      if (values.headcountAllocation !== undefined) {
        await assertAllocationCanBeSaved(tx, id, values.headcountAllocation);
      }
      return updateOrganizationNode(tx, id, values);
    });
    await logAudit('AUDIT', 'Organization unit updated.', 'API:HR:OrganizationHierarchy:Update', session.user.id, { id });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update organization hierarchy' }, { status: 400 });
  }
}
