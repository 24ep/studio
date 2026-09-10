import { NextRequest, NextResponse } from 'next/server';

import { requireAutomationApiKey } from '@/lib/api-route-guards';
import { auditContextFromRequest, runWithAuditContext } from '@/lib/auditLog';
import { runScheduledAuditGovernance } from '@/lib/audit-governance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const unauthorized = requireAutomationApiKey(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await runWithAuditContext(auditContextFromRequest(request), runScheduledAuditGovernance);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[AUDIT SCHEDULER] Failed:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Scheduled audit controls failed' }, { status: 500 });
  }
}
