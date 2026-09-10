import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAutomationApiKey } from '@/lib/api-route-guards';
import { auditContextFromRequest, runWithAuditContext } from '@/lib/auditLog';
import { recordAssuranceEvidence } from '@/lib/audit-governance';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  kind: z.enum(['recovery_test', 'change_release', 'penetration_test', 'incident_exercise']),
  reference: z.string().trim().min(2).max(300),
  status: z.string().trim().min(2).max(32),
  occurredAt: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()).default({}),
  approverUserId: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const unauthorized = requireAutomationApiKey(request);
  if (unauthorized) return unauthorized;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid assurance evidence' }, { status: 400 });
  try {
    const owner = await getPool().query<{ id: string }>(`SELECT id FROM "User" WHERE role = 'Admin' AND is_active = true ORDER BY "createdAt" LIMIT 1`);
    if (!owner.rowCount) return NextResponse.json({ message: 'No active audit evidence owner is configured' }, { status: 503 });
    const result = await runWithAuditContext(auditContextFromRequest(request), () => recordAssuranceEvidence({ id: owner.rows[0].id, name: 'CI assurance recorder' }, parsed.data));
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[AUDIT ASSURANCE] Submission failed:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to record assurance evidence' }, { status: 500 });
  }
}
