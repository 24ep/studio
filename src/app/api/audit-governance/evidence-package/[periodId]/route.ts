import { NextRequest, NextResponse } from 'next/server';

import { requireAnyApiPermission } from '@/lib/api-route-guards';
import { recordAuditEvent } from '@/lib/auditLog';
import { buildEvidencePackage } from '@/lib/audit-governance';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest, context: { params: Promise<{ periodId: string }> }) {
  const access = await requireAnyApiPermission(['AUDIT_CONTROLS_VIEW', 'LOGS_EXPORT']);
  if (access.response || !access.session) return access.response ?? NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const { periodId } = await context.params;
    const company = access.session.user.role === 'Admin' ? null : await getPool().query<{ company_id: string | null }>(`SELECT company_id FROM hr_employees WHERE user_id = $1::uuid LIMIT 1`, [access.session.user.id]);
    if (access.session.user.role !== 'Admin' && !company?.rows[0]?.company_id) return NextResponse.json({ message: 'An employee company scope is required for audit export' }, { status: 403 });
    const actorCompanyId = company?.rows[0]?.company_id ?? null;
    const auditPackage = await buildEvidencePackage(periodId, actorCompanyId);
    await recordAuditEvent({ action: 'evidence_package.exported', message: `Evidence package ${periodId} exported.`, source: 'AuditGovernance', actorUserId: access.session.user.id, companyId: actorCompanyId, entityType: 'AuditPeriod', entityId: periodId, metadata: { packageChecksum: auditPackage.packageChecksum } });
    return new NextResponse(JSON.stringify(auditPackage, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-evidence-${periodId}.json"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to export evidence package' }, { status: 404 });
  }
}
