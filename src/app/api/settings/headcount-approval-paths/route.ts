import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  approvalRouteCatalogSchema,
  getHeadcountApprovalRoutes,
  HEADCOUNT_APPROVAL_PATHS_SETTING_KEY,
} from '@/lib/headcount-approval-path-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.user, 'POSITIONS_VIEW') && !hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ routes: await getHeadcountApprovalRoutes() });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const body = await readRequestJsonResult(request);
  if (!body.ok) return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  const parsed = approvalRouteCatalogSchema.safeParse((body.value as { routes?: unknown })?.routes);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Invalid approval paths' }, { status: 400 });
  }
  await getPool().query(
    `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [HEADCOUNT_APPROVAL_PATHS_SETTING_KEY, JSON.stringify(parsed.data)],
  );
  return NextResponse.json({ routes: parsed.data });
}
