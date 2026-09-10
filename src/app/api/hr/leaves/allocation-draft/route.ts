import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MANAGE_PERMISSIONS = ['HR_WORKFORCE_MANAGE'] as PlatformModuleId[];
const MAX_DRAFT_BYTES = 256 * 1024;

type DraftRow = { payload: unknown; updated_at: Date };

function canManageLeaves(user: Parameters<typeof hasAnyPermission>[0]) {
  return hasAnyPermission(user, MANAGE_PERMISSIONS);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!canManageLeaves(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient Leaves manage permission.' }, { status: 403 });
  }

  const rows = await prisma.$queryRaw<DraftRow[]>`
    SELECT payload, updated_at
    FROM "hr_leave_allocation_drafts"
    WHERE user_id = ${session.user.id}::uuid
    LIMIT 1
  `;

  const row = rows[0];
  return NextResponse.json({
    data: row ? { draft: row.payload, updatedAt: row.updated_at.toISOString() } : null,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!canManageLeaves(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient Leaves manage permission.' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ message: 'Invalid allocation draft.' }, { status: 400 });
  }

  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_DRAFT_BYTES) {
    return NextResponse.json({ message: 'Allocation draft is too large.' }, { status: 413 });
  }

  const rows = await prisma.$queryRaw<DraftRow[]>`
    INSERT INTO "hr_leave_allocation_drafts" (user_id, payload, created_at, updated_at)
    VALUES (${session.user.id}::uuid, ${serialized}::jsonb, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    RETURNING payload, updated_at
  `;

  await logAudit(
    'AUDIT',
    'Leave allocation draft saved.',
    'API:HR:Leaves:AllocationDraft:Save',
    session.user.id,
  );

  return NextResponse.json({
    data: { draft: rows[0]?.payload ?? payload, updatedAt: rows[0]?.updated_at?.toISOString() ?? new Date().toISOString() },
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }
  if (!canManageLeaves(session.user)) {
    return NextResponse.json({ message: 'Forbidden: Insufficient Leaves manage permission.' }, { status: 403 });
  }

  await prisma.$executeRaw`
    DELETE FROM "hr_leave_allocation_drafts"
    WHERE user_id = ${session.user.id}::uuid
  `;

  await logAudit(
    'AUDIT',
    'Leave allocation draft cleared.',
    'API:HR:Leaves:AllocationDraft:Delete',
    session.user.id,
  );

  return NextResponse.json({ data: { deleted: true } });
}
