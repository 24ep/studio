import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAnyApiPermission } from '@/lib/api-route-guards';
import { auditContextFromRequest, runWithAuditContext } from '@/lib/auditLog';
import {
  approveRetentionExecution,
  collectEvidence,
  completePrivacyRequest,
  createAccessReviewCampaign,
  createAuditPeriod,
  createLegalHold,
  createRetentionExecution,
  decideAccessReviewItem,
  getAuditGovernanceOverview,
  lockAuditPeriod,
  recordAssuranceEvidence,
  releaseLegalHold,
  runControlScan,
  runRetentionExecution,
  scanSodViolations,
  updateAuditException,
} from '@/lib/audit-governance';
import { hasAnyPermission } from '@/lib/permissions';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const jsonRecord = z.record(z.string(), z.unknown());
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create_legal_hold'), name: z.string().trim().min(3).max(200), reason: z.string().trim().min(10).max(4000), scope: jsonRecord.default({}), endsAt: z.string().datetime().nullable().optional() }),
  z.object({ action: z.literal('release_legal_hold'), id: z.string().uuid(), reason: z.string().trim().min(10).max(4000) }),
  z.object({ action: z.literal('preview_retention'), policyId: z.string().uuid().nullable().optional(), recordType: z.string().trim().min(2).max(120), cutoffAt: z.string().datetime() }),
  z.object({ action: z.literal('request_retention'), policyId: z.string().uuid().nullable().optional(), recordType: z.string().trim().min(2).max(120), cutoffAt: z.string().datetime() }),
  z.object({ action: z.literal('approve_retention'), id: z.string().uuid() }),
  z.object({ action: z.literal('run_retention'), id: z.string().uuid() }),
  z.object({ action: z.literal('create_access_review'), name: z.string().trim().min(3).max(200), dueAt: z.string().datetime(), companyId: z.string().uuid().nullable().optional() }),
  z.object({ action: z.literal('decide_access_item'), itemId: z.string().uuid(), decision: z.enum(['approve', 'revoke', 'modify', 'exception']), justification: z.string().trim().min(5).max(4000), permissions: z.array(z.string().trim().min(1).max(160)).max(300).optional() }),
  z.object({ action: z.literal('scan_sod') }),
  z.object({ action: z.literal('run_control_scan') }),
  z.object({ action: z.literal('create_period'), name: z.string().trim().min(3).max(200), framework: z.string().trim().min(2).max(80), startsAt: z.string().datetime(), endsAt: z.string().datetime() }),
  z.object({ action: z.literal('collect_evidence'), controlId: z.string().uuid(), periodId: z.string().uuid().nullable().optional(), title: z.string().trim().min(3).max(300), description: z.string().trim().max(4000).nullable().optional(), evidenceType: z.string().trim().min(2).max(60), source: z.string().trim().max(500).nullable().optional(), payload: jsonRecord.default({}) }),
  z.object({ action: z.literal('lock_period'), id: z.string().uuid() }),
  z.object({ action: z.literal('record_assurance'), kind: z.enum(['recovery_test', 'change_release', 'penetration_test', 'incident_exercise']), reference: z.string().trim().min(2).max(300), status: z.string().trim().min(2).max(32), occurredAt: z.string().datetime(), payload: jsonRecord.default({}), approverUserId: z.string().uuid().nullable().optional() }),
  z.object({ action: z.literal('complete_privacy_request'), requestId: z.string().uuid(), decision: z.string().trim().min(5).max(4000), fulfillment: jsonRecord }),
  z.object({ action: z.literal('update_exception'), id: z.string().uuid(), status: z.enum(['investigating', 'remediated', 'accepted', 'closed']), remediation: z.string().trim().min(5).max(4000) }),
]);

const permissionsByAction: Record<z.infer<typeof actionSchema>['action'], string[]> = {
  create_legal_hold: ['AUDIT_RETENTION_MANAGE'], release_legal_hold: ['AUDIT_RETENTION_MANAGE'],
  preview_retention: ['AUDIT_RETENTION_MANAGE'], request_retention: ['AUDIT_RETENTION_MANAGE'],
  approve_retention: ['AUDIT_RETENTION_MANAGE'], run_retention: ['AUDIT_RETENTION_MANAGE'],
  create_access_review: ['AUDIT_ACCESS_REVIEW_MANAGE'], decide_access_item: ['AUDIT_ACCESS_REVIEW_MANAGE'],
  scan_sod: ['AUDIT_ACCESS_REVIEW_MANAGE'], run_control_scan: ['AUDIT_EVIDENCE_MANAGE'],
  create_period: ['AUDIT_EVIDENCE_MANAGE'], collect_evidence: ['AUDIT_EVIDENCE_MANAGE'],
  lock_period: ['AUDIT_PERIOD_LOCK'], record_assurance: ['AUDIT_EVIDENCE_MANAGE'],
  complete_privacy_request: ['AUDIT_RETENTION_MANAGE'],
  update_exception: ['AUDIT_EVIDENCE_MANAGE'],
};

async function actorFromSession(user: Record<string, unknown>) {
  const id = String(user.id);
  if (user.role === 'Admin') return { id, name: typeof user.name === 'string' ? user.name : null, companyId: null };
  const company = await getPool().query<{ company_id: string | null }>(`SELECT company_id FROM hr_employees WHERE user_id = $1::uuid LIMIT 1`, [id]);
  if (!company.rows[0]?.company_id) return null;
  return { id, name: typeof user.name === 'string' ? user.name : null, companyId: company.rows[0].company_id };
}

export async function GET(request: NextRequest) {
  const access = await requireAnyApiPermission(['AUDIT_CONTROLS_VIEW', 'LOGS_VIEW']);
  if (access.response || !access.session) return access.response ?? NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const actor = await actorFromSession(access.session.user as unknown as Record<string, unknown>);
    if (!actor) return NextResponse.json({ message: 'An employee company scope is required for audit access' }, { status: 403 });
    return await runWithAuditContext({ ...auditContextFromRequest(request), companyId: actor.companyId }, async () => NextResponse.json(await getAuditGovernanceOverview(actor), { headers: { 'Cache-Control': 'no-store' } }));
  } catch (error) {
    console.error('[AUDIT GOVERNANCE] Overview failed:', error);
    return NextResponse.json({ message: 'Unable to load audit controls' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAnyApiPermission(['AUDIT_EVIDENCE_MANAGE', 'AUDIT_ACCESS_REVIEW_MANAGE', 'AUDIT_RETENTION_MANAGE', 'AUDIT_PERIOD_LOCK']);
  if (access.response || !access.session) return access.response ?? NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid audit-control request', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (access.session.user.role !== 'Admin' && !hasAnyPermission(access.session.user, permissionsByAction[parsed.data.action])) {
    return NextResponse.json({ message: 'Insufficient permission for this audit-control action' }, { status: 403 });
  }
  const actor = await actorFromSession(access.session.user as unknown as Record<string, unknown>);
  if (!actor) return NextResponse.json({ message: 'An employee company scope is required for this audit action' }, { status: 403 });
  try {
    const result = await runWithAuditContext({ ...auditContextFromRequest(request), companyId: actor.companyId }, async () => {
      const data = parsed.data;
      switch (data.action) {
        case 'create_legal_hold': return createLegalHold(actor, data);
        case 'release_legal_hold': return releaseLegalHold(actor, data);
        case 'preview_retention': return createRetentionExecution(actor, { ...data, mode: 'dry_run' });
        case 'request_retention': return createRetentionExecution(actor, { ...data, mode: 'execute' });
        case 'approve_retention': return approveRetentionExecution(actor, data.id);
        case 'run_retention': return runRetentionExecution(actor, data.id);
        case 'create_access_review': return createAccessReviewCampaign(actor, data);
        case 'decide_access_item': return decideAccessReviewItem(actor, data);
        case 'scan_sod': return scanSodViolations(actor);
        case 'run_control_scan': return runControlScan(actor);
        case 'create_period': return createAuditPeriod(actor, data);
        case 'collect_evidence': return collectEvidence(actor, data);
        case 'lock_period': return lockAuditPeriod(actor, data.id);
        case 'record_assurance': return recordAssuranceEvidence(actor, data);
        case 'complete_privacy_request': return completePrivacyRequest(actor, data);
        case 'update_exception': return updateAuditException(actor, data);
      }
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit-control action failed';
    const conflict = /not found|already|blocked|self-approval|locked/i.test(message);
    console.error('[AUDIT GOVERNANCE] Action failed:', error);
    return NextResponse.json({ message }, { status: conflict ? 409 : 500 });
  }
}
