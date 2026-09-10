import { createHash } from 'node:crypto';
import type { QueryResultRow } from 'pg';

import { getPool, withDbTransaction } from '@/lib/db';
import { deliverAuditArchiveOutbox, recordAuditEvent, retryAuditDeadLetters, verifyAuditChain } from '@/lib/auditLog';

type Actor = { id: string; companyId?: string | null; name?: string | null };
type JsonRecord = Record<string, unknown>;

const RETENTION_PROCESSORS: Record<string, { table: string; dateColumn: string; statusClause?: string; storageColumn?: string }> = {
  audit_dead_letters: { table: 'audit_event_dead_letters', dateColumn: 'created_at', statusClause: `status = 'resolved'` },
  completed_data_operations: { table: 'data_operation_jobs', dateColumn: 'updated_at', statusClause: `status IN ('completed','failed','cancelled')` },
  webhook_delivery_logs: { table: 'WebhookLog', dateColumn: 'createdAt' },
  completed_upload_jobs: {
    table: 'upload_queue', dateColumn: 'completed_date', storageColumn: 'file_path',
    statusClause: `status IN ('success','failed','cancelled')
      AND NOT EXISTS (SELECT 1 FROM "Attachment" attachment WHERE attachment."filePath" = upload_queue.file_path)
      AND NOT EXISTS (SELECT 1 FROM "Applicant" applicant WHERE applicant."resumePath" = upload_queue.file_path)`,
  },
  expired_sessions: { table: 'UserSession', dateColumn: 'expires_at', statusClause: `"is_active" = false` },
  screening_results: { table: 'screening_cases', dateColumn: 'completed_at', statusClause: `status IN ('completed','failed','cancelled')` },
};

function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function rowToCamel(row: QueryResultRow) {
  return row;
}

export async function getAuditGovernanceOverview(actor: Actor) {
  const pool = getPool();
  const scope = [actor.companyId ?? null];
  const [summary, events, controls, exceptions, holds, executions, campaigns, accessItems, periods, assurance, deadLetters] = await Promise.all([
    pool.query(`SELECT
      (SELECT COUNT(*)::int FROM audit_events WHERE ($1::uuid IS NULL OR company_id = $1::uuid)) AS "eventCount",
      (SELECT COUNT(*)::int FROM audit_exceptions WHERE status NOT IN ('closed','accepted') AND ($1::uuid IS NULL OR company_id = $1::uuid)) AS "openExceptionCount",
      (SELECT COUNT(*)::int FROM audit_legal_holds WHERE status = 'active' AND (ends_at IS NULL OR ends_at > NOW()) AND ($1::uuid IS NULL OR company_id = $1::uuid)) AS "activeHoldCount",
      (SELECT COUNT(*)::int FROM audit_access_review_items i JOIN audit_access_review_campaigns c ON c.id = i.campaign_id WHERE i.decision = 'pending' AND ($1::uuid IS NULL OR c.company_id = $1::uuid)) AS "pendingReviewCount",
      (SELECT COUNT(*)::int FROM audit_controls WHERE status = 'active') AS "activeControlCount",
      (SELECT COUNT(*)::int FROM audit_event_dead_letters WHERE status = 'pending' AND $1::uuid IS NULL) AS "auditFailureCount"`, scope),
    pool.query(`SELECT id, sequence::text, occurred_at AS "occurredAt", level, action, outcome, message,
      source, actor_user_id AS "actorUserId", entity_type AS "entityType", entity_id AS "entityId",
      event_hash AS "eventHash" FROM audit_events WHERE ($1::uuid IS NULL OR company_id = $1::uuid) ORDER BY sequence DESC LIMIT 100`, scope),
    pool.query(`SELECT id, code, title, description, category, framework_refs AS "frameworkRefs", frequency,
      status, next_due_at AS "nextDueAt" FROM audit_controls ORDER BY category, code`),
    pool.query(`SELECT id, title, description, severity, status, detector_key AS "detectorKey",
      owner_user_id AS "ownerUserId", due_at AS "dueAt", remediation, created_at AS "createdAt"
      FROM audit_exceptions WHERE ($1::uuid IS NULL OR company_id = $1::uuid)
      ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, created_at DESC LIMIT 200`, scope),
    pool.query(`SELECT id, company_id AS "companyId", name, reason, scope, status, starts_at AS "startsAt",
      ends_at AS "endsAt", created_by_id AS "createdById", created_at AS "createdAt"
      FROM audit_legal_holds WHERE ($1::uuid IS NULL OR company_id = $1::uuid) ORDER BY created_at DESC LIMIT 100`, scope),
    pool.query(`SELECT id, record_type AS "recordType", mode, status, cutoff_at AS "cutoffAt",
      candidate_count AS "candidateCount", processed_count AS "processedCount", held_count AS "heldCount",
      failed_count AS "failedCount", requested_by_id AS "requestedById", approved_by_id AS "approvedById",
      report, receipt_hash AS "receiptHash", created_at AS "createdAt"
      FROM audit_retention_executions WHERE ($1::uuid IS NULL OR company_id = $1::uuid) ORDER BY created_at DESC LIMIT 100`, scope),
    pool.query(`SELECT c.id, c.name, c.status, c.due_at AS "dueAt", c.owner_user_id AS "ownerUserId",
      c.created_at AS "createdAt", COUNT(i.id)::int AS "itemCount",
      COUNT(i.id) FILTER (WHERE i.decision = 'pending')::int AS "pendingCount"
      FROM audit_access_review_campaigns c LEFT JOIN audit_access_review_items i ON i.campaign_id = c.id
      WHERE ($1::uuid IS NULL OR c.company_id = $1::uuid) GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100`, scope),
    pool.query(`SELECT i.id, i.campaign_id AS "campaignId", i.subject_user_id AS "subjectUserId",
      i.access_snapshot AS "accessSnapshot", i.risk_flags AS "riskFlags", i.decision, i.justification,
      i.created_at AS "createdAt", c.name AS "campaignName"
      FROM audit_access_review_items i JOIN audit_access_review_campaigns c ON c.id = i.campaign_id
      WHERE ($1::uuid IS NULL OR c.company_id = $1::uuid)
      ORDER BY CASE WHEN i.decision = 'pending' THEN 0 ELSE 1 END, i.created_at DESC LIMIT 200`, scope),
    pool.query(`SELECT id, name, framework, starts_at AS "startsAt", ends_at AS "endsAt", status,
      locked_at AS "lockedAt", manifest_hash AS "manifestHash", created_at AS "createdAt"
      FROM audit_periods WHERE ($1::uuid IS NULL OR company_id = $1::uuid) ORDER BY created_at DESC LIMIT 100`, scope),
    pool.query(`SELECT id, kind, reference, status, occurred_at AS "occurredAt", checksum, payload
      FROM audit_assurance_evidence WHERE ($1::uuid IS NULL OR company_id = $1::uuid) ORDER BY occurred_at DESC LIMIT 100`, scope),
    pool.query(`SELECT id, error, attempts, status, next_attempt_at AS "nextAttemptAt", created_at AS "createdAt"
      FROM audit_event_dead_letters WHERE $1::uuid IS NULL ORDER BY created_at DESC LIMIT 50`, scope),
  ]);
  const chain = await verifyAuditChain().catch(error => ({ valid: false, checked: 0, error: error instanceof Error ? error.message : String(error) }));
  return {
    summary: summary.rows[0] ?? {}, chain,
    events: events.rows.map(rowToCamel), controls: controls.rows.map(rowToCamel),
    exceptions: exceptions.rows.map(rowToCamel), legalHolds: holds.rows.map(rowToCamel),
    retentionExecutions: executions.rows.map(rowToCamel), accessCampaigns: campaigns.rows.map(rowToCamel),
    accessReviewItems: accessItems.rows.map(rowToCamel),
    periods: periods.rows.map(rowToCamel), assuranceEvidence: assurance.rows.map(rowToCamel),
    deadLetters: deadLetters.rows.map(rowToCamel), generatedAt: new Date().toISOString(),
  };
}

export async function createLegalHold(actor: Actor, input: { name: string; reason: string; scope: JsonRecord; endsAt?: string | null }) {
  const result = await getPool().query<{ id: string }>(
    `INSERT INTO audit_legal_holds (company_id, name, reason, scope, ends_at, created_by_id)
     VALUES ($1::uuid, $2, $3, $4::jsonb, $5::timestamptz, $6::uuid) RETURNING id`,
    [actor.companyId ?? null, input.name, input.reason, JSON.stringify(input.scope), input.endsAt ?? null, actor.id],
  );
  await recordAuditEvent({ action: 'legal_hold.created', message: `Legal hold '${input.name}' created.`, source: 'AuditGovernance', actorUserId: actor.id, companyId: actor.companyId, entityType: 'AuditLegalHold', entityId: result.rows[0].id, reason: input.reason, afterValue: input });
  return result.rows[0];
}

export async function releaseLegalHold(actor: Actor, input: { id: string; reason: string }) {
  const result = await getPool().query(
    `UPDATE audit_legal_holds SET status = 'released', released_by_id = $2::uuid, released_at = NOW(), release_reason = $3
     WHERE id = $1::uuid AND status = 'active' AND ($4::uuid IS NULL OR company_id = $4::uuid) RETURNING id, name`, [input.id, actor.id, input.reason, actor.companyId ?? null],
  );
  if (!result.rowCount) throw new Error('Active legal hold not found');
  await recordAuditEvent({ action: 'legal_hold.released', message: `Legal hold '${result.rows[0].name}' released.`, source: 'AuditGovernance', actorUserId: actor.id, companyId: actor.companyId, entityType: 'AuditLegalHold', entityId: input.id, reason: input.reason });
  return result.rows[0];
}

async function activeHoldCount(recordType: string, companyId?: string | null) {
  const result = await getPool().query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM audit_legal_holds
     WHERE status = 'active' AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW())
       AND (company_id IS NULL OR company_id = $2::uuid)
       AND (scope = '{}'::jsonb OR scope->'recordTypes' ? $1)`, [recordType, companyId ?? null],
  );
  return result.rows[0]?.count ?? 0;
}

export async function createRetentionExecution(actor: Actor, input: { policyId?: string | null; recordType: string; cutoffAt: string; mode: 'dry_run' | 'execute' }) {
  if (actor.companyId) throw new Error('Initial retention processors require a global audit administrator');
  const processor = RETENTION_PROCESSORS[input.recordType];
  if (!processor) throw new Error(`No approved retention processor is registered for '${input.recordType}'`);
  const predicate = `${processor.dateColumn.includes('"') ? processor.dateColumn : `"${processor.dateColumn}"`} < $1::timestamptz${processor.statusClause ? ` AND ${processor.statusClause}` : ''}`;
  const countResult = await getPool().query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "${processor.table}" WHERE ${predicate}`, [input.cutoffAt]);
  const held = await activeHoldCount(input.recordType, actor.companyId);
  const status = input.mode === 'execute' ? 'awaiting_approval' : 'completed';
  const report = { processor: processor.table, dryRun: input.mode === 'dry_run', legalHoldActive: held > 0 };
  const result = await getPool().query<{ id: string }>(
    `INSERT INTO audit_retention_executions
      (policy_id, company_id, record_type, mode, status, cutoff_at, candidate_count, held_count, requested_by_id, completed_at, report)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::timestamptz, $7, $8, $9::uuid,
       CASE WHEN $5 = 'completed' THEN NOW() ELSE NULL END, $10::jsonb) RETURNING id`,
    [input.policyId ?? null, actor.companyId ?? null, input.recordType, input.mode, status, input.cutoffAt, countResult.rows[0]?.count ?? 0, held ? countResult.rows[0]?.count ?? 0 : 0, actor.id, JSON.stringify(report)],
  );
  await recordAuditEvent({ action: 'retention.execution_requested', message: `${input.mode === 'dry_run' ? 'Previewed' : 'Requested'} retention for ${input.recordType}.`, source: 'AuditGovernance', actorUserId: actor.id, companyId: actor.companyId, entityType: 'AuditRetentionExecution', entityId: result.rows[0].id, afterValue: { ...input, candidateCount: countResult.rows[0]?.count ?? 0, held: held > 0 } });
  return { id: result.rows[0].id, candidateCount: countResult.rows[0]?.count ?? 0, held: held > 0, status };
}

export async function approveRetentionExecution(actor: Actor, id: string) {
  const result = await getPool().query(
    `UPDATE audit_retention_executions SET approved_by_id = $2::uuid, approved_at = NOW(), status = 'queued'
     WHERE id = $1::uuid AND status = 'awaiting_approval' AND requested_by_id <> $2::uuid
       AND ($3::uuid IS NULL OR company_id = $3::uuid) RETURNING id, record_type`, [id, actor.id, actor.companyId ?? null],
  );
  if (!result.rowCount) throw new Error('Execution not found, already handled, or self-approval is not allowed');
  await recordAuditEvent({ action: 'retention.execution_approved', message: `Retention execution for ${result.rows[0].record_type} approved.`, source: 'AuditGovernance', actorUserId: actor.id, entityType: 'AuditRetentionExecution', entityId: id });
  return result.rows[0];
}

export async function runRetentionExecution(actor: Actor, id: string) {
  const execution = await withDbTransaction(async client => {
    const selected = await client.query<{ record_type: string; cutoff_at: Date; company_id: string | null; candidate_count: number }>(
      `SELECT record_type, cutoff_at, company_id, candidate_count FROM audit_retention_executions
       WHERE id = $1::uuid AND status = 'queued' AND approved_by_id IS NOT NULL
         AND ($2::uuid IS NULL OR company_id = $2::uuid) FOR UPDATE`, [id, actor.companyId ?? null],
    );
    if (!selected.rowCount) throw new Error('Approved queued execution not found');
    const row = selected.rows[0];
    const holds = await client.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM audit_legal_holds WHERE status = 'active'
       AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW())
       AND (company_id IS NULL OR company_id = $2::uuid) AND (scope = '{}'::jsonb OR scope->'recordTypes' ? $1)`,
      [row.record_type, row.company_id],
    );
    if ((holds.rows[0]?.count ?? 0) > 0) throw new Error('Execution is blocked by an active legal hold');
    await client.query(`UPDATE audit_retention_executions SET status = 'running', started_at = NOW() WHERE id = $1::uuid`, [id]);
    return row;
  });

  const processor = RETENTION_PROCESSORS[execution.record_type];
  if (!processor) throw new Error('Retention processor is no longer registered');
  const predicate = `${processor.dateColumn.includes('"') ? processor.dateColumn : `"${processor.dateColumn}"`} < $1::timestamptz${processor.statusClause ? ` AND ${processor.statusClause}` : ''}`;
  const storageProjection = processor.storageColumn ? `, "${processor.storageColumn}" AS storage_key` : ', NULL::text AS storage_key';
  const candidates = await getPool().query<{ id: string; storage_key: string | null }>(`SELECT id::text${storageProjection} FROM "${processor.table}" WHERE ${predicate} ORDER BY id LIMIT 10000`, [execution.cutoff_at]);
  for (const candidate of candidates.rows) {
    await getPool().query(
      `INSERT INTO audit_retention_execution_items (execution_id, entity_id, storage_keys) VALUES ($1::uuid, $2, $3::jsonb)
       ON CONFLICT (execution_id, entity_id) DO NOTHING`,
      [id, candidate.id, JSON.stringify(candidate.storage_key ? [candidate.storage_key] : [])],
    );
  }

  let processedCount = 0;
  let failedCount = Math.max(0, execution.candidate_count - candidates.rows.length);
  for (const candidate of candidates.rows) {
    try {
      if (candidate.storage_key) {
        const { minioClient, MINIO_BUCKET } = await import('@/lib/minio');
        await minioClient.removeObject(MINIO_BUCKET, candidate.storage_key);
      }
      const deleted = await getPool().query(`DELETE FROM "${processor.table}" WHERE id::text = $1`, [candidate.id]);
      if (!deleted.rowCount) throw new Error('Record changed or was already removed');
      await getPool().query(`UPDATE audit_retention_execution_items SET status = 'deleted', processed_at = NOW() WHERE execution_id = $1::uuid AND entity_id = $2`, [id, candidate.id]);
      processedCount += 1;
    } catch (error) {
      failedCount += 1;
      await getPool().query(`UPDATE audit_retention_execution_items SET status = 'failed', error = $3, processed_at = NOW() WHERE execution_id = $1::uuid AND entity_id = $2`, [id, candidate.id, error instanceof Error ? error.message : String(error)]);
    }
  }
  const finalStatus = failedCount > 0 ? 'failed' : 'completed';
  const receipt = { id, recordType: execution.record_type, candidateCount: candidates.rowCount, processedCount, failedCount, completedAt: new Date().toISOString(), approved: true };
  const receiptHash = hash(receipt);
  await getPool().query(`UPDATE audit_retention_executions SET status = $2, processed_count = $3, failed_count = $4, completed_at = NOW(), report = $5::jsonb, receipt_hash = $6 WHERE id = $1::uuid`, [id, finalStatus, processedCount, failedCount, JSON.stringify(receipt), receiptHash]);
  await recordAuditEvent({ action: `retention.execution_${finalStatus}`, outcome: failedCount ? 'partial' : 'success', message: `Retention execution processed ${processedCount} ${execution.record_type} records with ${failedCount} failures.`, source: 'AuditGovernance', actorUserId: actor.id, companyId: execution.company_id, entityType: 'AuditRetentionExecution', entityId: id, afterValue: receipt });
  return { ...receipt, receiptHash, status: finalStatus };
}

function accessRiskFlags(user: QueryResultRow): string[] {
  const flags: string[] = [];
  const permissions = user.permissions as string[];
  if (user.role === 'Admin' || permissions.includes('USERS_PERMISSIONS_MANAGE')) flags.push('privileged');
  if (!user.two_factor_enabled && flags.includes('privileged')) flags.push('privileged_without_2fa');
  if (!user.last_activity_at || new Date(user.last_activity_at).getTime() < Date.now() - 90 * 86400000) flags.push('dormant');
  if (user.deleted_from_ad) flags.push('removed_from_directory');
  return flags;
}

export async function createAccessReviewCampaign(actor: Actor, input: { name: string; dueAt: string; companyId?: string | null }) {
  if (actor.companyId && input.companyId && actor.companyId !== input.companyId) throw new Error('Requested company is outside your authorized scope');
  const targetCompanyId = input.companyId ?? actor.companyId ?? null;
  const completed = await withDbTransaction(async client => {
    const campaign = await client.query<{ id: string }>(
      `INSERT INTO audit_access_review_campaigns (company_id, name, scope, status, due_at, owner_user_id, launched_at)
       VALUES ($1::uuid, $2, $3::jsonb, 'active', $4::timestamptz, $5::uuid, NOW()) RETURNING id`,
      [targetCompanyId, input.name, JSON.stringify({ companyId: targetCompanyId }), input.dueAt, actor.id],
    );
    const users = await client.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.deleted_from_ad, u.two_factor_enabled,
        GREATEST(MAX(s.last_activity_at), MAX(s.created_at)) AS last_activity_at,
        ARRAY(SELECT DISTINCT permission FROM unnest(COALESCE(u.module_permissions, '{}') || COALESCE(g.permissions, '{}')) permission) AS permissions
       FROM "User" u LEFT JOIN "UserGroup" g ON g.id = u."userGroupId"
       LEFT JOIN hr_employees employee ON employee.user_id = u.id
       LEFT JOIN "UserSession" s ON s.user_id = u.id
       WHERE u.is_active = true AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
       GROUP BY u.id, g.permissions ORDER BY u.name`, [targetCompanyId],
    );
    for (const user of users.rows) {
      const snapshot = { name: user.name, email: user.email, role: user.role, permissions: user.permissions, twoFactorEnabled: user.two_factor_enabled, lastActivityAt: user.last_activity_at };
      await client.query(
        `INSERT INTO audit_access_review_items (campaign_id, subject_user_id, reviewer_user_id, access_snapshot, risk_flags)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::jsonb, $5::jsonb)`,
        [campaign.rows[0].id, user.id, actor.id, JSON.stringify(snapshot), JSON.stringify(accessRiskFlags(user))],
      );
    }
    return { id: campaign.rows[0].id, itemCount: users.rowCount };
  });
  await recordAuditEvent({ action: 'access_review.launched', message: `Access review '${input.name}' launched for ${completed.itemCount} users.`, source: 'AuditGovernance', actorUserId: actor.id, companyId: targetCompanyId, entityType: 'AuditAccessReviewCampaign', entityId: completed.id, afterValue: { ...input, companyId: targetCompanyId, userCount: completed.itemCount } });
  return completed;
}

export async function decideAccessReviewItem(actor: Actor, input: { itemId: string; decision: 'approve' | 'revoke' | 'modify' | 'exception'; justification: string; permissions?: string[] }) {
  const completed = await withDbTransaction(async client => {
    const item = await client.query<{ subject_user_id: string; campaign_id: string; company_id: string | null }>(
      `UPDATE audit_access_review_items SET decision = $2, justification = $3, reviewer_user_id = $4::uuid, decided_at = NOW()
       WHERE id = $1::uuid AND decision = 'pending'
         AND EXISTS (SELECT 1 FROM audit_access_review_campaigns c WHERE c.id = audit_access_review_items.campaign_id AND ($5::uuid IS NULL OR c.company_id = $5::uuid))
       RETURNING subject_user_id, campaign_id,
         (SELECT company_id FROM audit_access_review_campaigns WHERE id = audit_access_review_items.campaign_id) AS company_id`,
      [input.itemId, input.decision, input.justification, actor.id, actor.companyId ?? null],
    );
    if (!item.rowCount) throw new Error('Pending review item not found');
    if (input.decision === 'revoke') {
      await client.query(`UPDATE "User" SET is_active = false, "updatedAt" = NOW() WHERE id = $1::uuid`, [item.rows[0].subject_user_id]);
      await client.query(`UPDATE "UserSession" SET "is_active" = false WHERE user_id = $1::uuid AND "is_active" = true`, [item.rows[0].subject_user_id]);
      await client.query(`UPDATE audit_access_review_items SET remediated_at = NOW(), remediation = $2::jsonb WHERE id = $1::uuid`, [input.itemId, JSON.stringify({ action: 'account_disabled_and_sessions_revoked', by: actor.id })]);
    }
    if (input.decision === 'modify') {
      if (!input.permissions) throw new Error('A replacement permission set is required for access modification');
      await client.query(`UPDATE "User" SET module_permissions = $2::text[], "updatedAt" = NOW() WHERE id = $1::uuid`, [item.rows[0].subject_user_id, [...new Set(input.permissions)]]);
      await client.query(`UPDATE "UserSession" SET "is_active" = false WHERE user_id = $1::uuid AND "is_active" = true`, [item.rows[0].subject_user_id]);
      await client.query(`UPDATE audit_access_review_items SET remediated_at = NOW(), remediation = $2::jsonb WHERE id = $1::uuid`, [input.itemId, JSON.stringify({ action: 'direct_permissions_replaced_and_sessions_revoked', permissions: [...new Set(input.permissions)], by: actor.id })]);
    }
    const remaining = await client.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM audit_access_review_items WHERE campaign_id = $1::uuid AND decision = 'pending'`, [item.rows[0].campaign_id]);
    if ((remaining.rows[0]?.count ?? 0) === 0) {
      const certification = await client.query(`SELECT subject_user_id, decision, justification, remediated_at FROM audit_access_review_items WHERE campaign_id = $1::uuid ORDER BY subject_user_id`, [item.rows[0].campaign_id]);
      await client.query(`UPDATE audit_access_review_campaigns SET status = 'completed', completed_at = NOW(), certification_hash = $2 WHERE id = $1::uuid`, [item.rows[0].campaign_id, hash(certification.rows)]);
    }
    return item.rows[0];
  });
  await recordAuditEvent({ action: `access_review.${input.decision}`, message: `Access review item marked ${input.decision}.`, source: 'AuditGovernance', actorUserId: actor.id, companyId: completed.company_id, entityType: 'User', entityId: completed.subject_user_id, reason: input.justification, metadata: { campaignId: completed.campaign_id, itemId: input.itemId } });
  return completed;
}

export async function updateAuditException(actor: Actor, input: { id: string; status: 'investigating' | 'remediated' | 'accepted' | 'closed'; remediation: string }) {
  const current = await getPool().query<{ owner_user_id: string | null; title: string; company_id: string | null }>(`SELECT owner_user_id, title, company_id FROM audit_exceptions WHERE id = $1::uuid AND ($2::uuid IS NULL OR company_id = $2::uuid)`, [input.id, actor.companyId ?? null]);
  if (!current.rowCount) throw new Error('Audit exception not found');
  if ((input.status === 'closed' || input.status === 'accepted') && current.rows[0].owner_user_id === actor.id) {
    throw new Error('Exception closure requires an independent reviewer');
  }
  const result = await getPool().query(
    `UPDATE audit_exceptions SET status = $2, remediation = $3,
       owner_user_id = COALESCE(owner_user_id, $4::uuid),
       reviewer_user_id = CASE WHEN $2 IN ('closed','accepted') THEN $4::uuid ELSE reviewer_user_id END,
       closed_at = CASE WHEN $2 IN ('closed','accepted') THEN NOW() ELSE NULL END,
       updated_at = NOW() WHERE id = $1::uuid AND ($5::uuid IS NULL OR company_id = $5::uuid) RETURNING id`,
    [input.id, input.status, input.remediation, actor.id, actor.companyId ?? null],
  );
  if (!result.rowCount) throw new Error('Audit exception scope changed before update');
  await recordAuditEvent({ action: `control_exception.${input.status}`, message: `Exception '${current.rows[0].title}' marked ${input.status}.`, source: 'AuditGovernance', actorUserId: actor.id, companyId: current.rows[0].company_id, entityType: 'AuditException', entityId: input.id, reason: input.remediation });
  return result.rows[0];
}

export async function scanSodViolations(actor: Actor) {
  const result = await getPool().query(
    `SELECT u.id AS user_id, u.name, u.email, rule.id AS rule_id, rule.code, rule.name AS rule_name, rule.severity,
      rule.permission_a, rule.permission_b
     FROM "User" u LEFT JOIN "UserGroup" g ON g.id = u."userGroupId"
     LEFT JOIN hr_employees employee ON employee.user_id = u.id
     CROSS JOIN audit_sod_rules rule
     WHERE u.is_active = true AND rule.is_active = true AND ($1::uuid IS NULL OR employee.company_id = $1::uuid)
       AND rule.permission_a = ANY(COALESCE(u.module_permissions, '{}') || COALESCE(g.permissions, '{}'))
       AND rule.permission_b = ANY(COALESCE(u.module_permissions, '{}') || COALESCE(g.permissions, '{}'))`,
    [actor.companyId ?? null],
  );
  for (const row of result.rows) {
    const fingerprint = hash({ detector: 'sod', userId: row.user_id, rule: row.code });
    await getPool().query(
      `INSERT INTO audit_exceptions (control_id, detector_key, fingerprint, title, description, severity, company_id, evidence, due_at)
       SELECT id, 'sod_conflict', $1, $2, $3, $4, $5::uuid, $6::jsonb, NOW() + INTERVAL '14 days' FROM audit_controls WHERE code = 'IAM-01'
       ON CONFLICT (fingerprint) DO UPDATE SET status = CASE WHEN audit_exceptions.status = 'closed' THEN 'open' ELSE audit_exceptions.status END,
         evidence = EXCLUDED.evidence, updated_at = NOW()`,
      [fingerprint, `Segregation-of-duties conflict: ${row.rule_name}`, `${row.name} holds both ${row.permission_a} and ${row.permission_b}.`, row.severity, actor.companyId ?? null, JSON.stringify(row)],
    );
  }
  await recordAuditEvent({ action: 'control_scan.sod_completed', message: `Segregation-of-duties scan found ${result.rowCount} conflicts.`, source: 'AuditGovernance', actorUserId: actor.id, companyId: actor.companyId, afterValue: { conflicts: result.rowCount } });
  return { conflicts: result.rowCount };
}

export async function runControlScan(actor: Actor) {
  if (actor.companyId) throw new Error('Platform-wide control scans require a global audit administrator');
  const chain = await verifyAuditChain();
  const detectors = await getPool().query(
    `SELECT * FROM (
      SELECT 'audit_dead_letters' AS detector, 'AUD-01' AS control_code, 'Audit events awaiting recovery' AS title,
        'high' AS severity, COUNT(*)::int AS count FROM audit_event_dead_letters WHERE status = 'pending'
      UNION ALL SELECT 'archive_delivery_failed', 'AUD-01', 'Immutable archive deliveries failed', 'critical', COUNT(*)::int
        FROM audit_archive_outbox WHERE status = 'failed' AND attempts >= 3
      UNION ALL SELECT 'overdue_privacy', 'PRV-01', 'Privacy requests are overdue', 'high', COUNT(*)::int
        FROM hr_privacy_requests WHERE status NOT IN ('completed','closed','withdrawn') AND due_at < NOW()
      UNION ALL SELECT 'overdue_access_review', 'IAM-01', 'Access review decisions are overdue', 'high', COUNT(*)::int
        FROM audit_access_review_items i JOIN audit_access_review_campaigns c ON c.id = i.campaign_id
        WHERE i.decision = 'pending' AND c.due_at < NOW()
      UNION ALL SELECT 'failed_retention', 'PRV-01', 'Retention executions failed', 'high', COUNT(*)::int
        FROM audit_retention_executions WHERE status = 'failed'
      UNION ALL SELECT 'disabled_active_sessions', 'IAM-01', 'Disabled users retain active sessions', 'critical', COUNT(*)::int
        FROM "UserSession" s JOIN "User" u ON u.id = s.user_id WHERE u.is_active = false AND s.is_active = true
      UNION ALL SELECT 'recovery_test_overdue', 'OPS-01', 'Backup restoration test is overdue', 'high',
        CASE WHEN MAX(occurred_at) IS NULL OR MAX(occurred_at) < NOW() - INTERVAL '120 days' THEN 1 ELSE 0 END
        FROM audit_assurance_evidence WHERE kind = 'recovery_test' AND status = 'passed'
    ) detector_results WHERE count > 0`,
  );
  const findings = [...detectors.rows];
  if (process.env.NODE_ENV === 'production' && (!process.env.AUDIT_ARCHIVE_URL || !process.env.AUDIT_ARCHIVE_HMAC_SECRET)) {
    findings.push({ detector: 'archive_not_configured', control_code: 'AUD-01', title: 'Immutable external audit archive is not configured', severity: 'critical', count: 1 });
  }
  if (!chain.valid) findings.push({ detector: 'audit_chain_integrity', control_code: 'AUD-01', title: 'Audit chain integrity verification failed', severity: 'critical', count: 1 });
  let newCriticalFindings = 0;
  for (const finding of findings) {
    const fingerprint = hash({ detector: finding.detector });
    const upserted = await getPool().query<{ inserted: boolean }>(
      `INSERT INTO audit_exceptions (control_id, detector_key, fingerprint, title, description, severity, evidence, due_at)
       SELECT id, $1, $2, $3, $4, $5, $6::jsonb,
         NOW() + CASE WHEN $5 = 'critical' THEN INTERVAL '1 day' ELSE INTERVAL '7 days' END
       FROM audit_controls WHERE code = $7
       ON CONFLICT (fingerprint) DO UPDATE SET status = CASE WHEN audit_exceptions.status = 'closed' THEN 'open' ELSE audit_exceptions.status END,
         description = EXCLUDED.description, evidence = EXCLUDED.evidence, updated_at = NOW()
       RETURNING (xmax = 0) AS inserted`,
      [finding.detector, fingerprint, finding.title, `${finding.count} record(s) require attention.`, finding.severity, JSON.stringify({ count: finding.count, scannedAt: new Date().toISOString() }), finding.control_code],
    );
    if (finding.severity === 'critical' && upserted.rows[0]?.inserted) newCriticalFindings += 1;
  }
  if (newCriticalFindings > 0) {
    const admins = await getPool().query<{ id: string }>(`SELECT id FROM "User" WHERE role = 'Admin' AND is_active = true`);
    const { NotificationService } = await import('@/lib/notificationService');
    await Promise.allSettled(admins.rows.map(admin => NotificationService.createNotification(admin.id, {
      type: 'audit_control_critical', title: 'Critical audit control exception',
      message: `${newCriticalFindings} new critical control finding${newCriticalFindings === 1 ? '' : 's'} require immediate review.`,
      data: { href: '/audit-controls', findingCount: newCriticalFindings },
    }, actor.id)));
  }
  const scanPayload = { chain, findingCount: findings.length, findings, completedAt: new Date().toISOString() };
  await getPool().query(`INSERT INTO audit_assurance_evidence (kind, reference, status, occurred_at, owner_user_id, company_id, payload, checksum) VALUES ('control_scan', $1, 'completed', NOW(), $2::uuid, $3::uuid, $4::jsonb, $5)`, [`scan-${Date.now()}`, actor.id, actor.companyId ?? null, JSON.stringify(scanPayload), hash(scanPayload)]);
  await recordAuditEvent({ action: 'control_scan.completed', message: `Continuous control scan completed with ${findings.length} findings.`, source: 'AuditGovernance', actorUserId: actor.id, afterValue: scanPayload });
  return scanPayload;
}

export async function createAuditPeriod(actor: Actor, input: { name: string; framework: string; startsAt: string; endsAt: string }) {
  const result = await getPool().query<{ id: string }>(
    `INSERT INTO audit_periods (name, framework, company_id, starts_at, ends_at) VALUES ($1, $2, $3::uuid, $4::timestamptz, $5::timestamptz) RETURNING id`,
    [input.name, input.framework, actor.companyId ?? null, input.startsAt, input.endsAt],
  );
  await recordAuditEvent({ action: 'audit_period.created', message: `Audit period '${input.name}' created.`, source: 'AuditGovernance', actorUserId: actor.id, entityType: 'AuditPeriod', entityId: result.rows[0].id, afterValue: input });
  return result.rows[0];
}

export async function collectEvidence(actor: Actor, input: { controlId: string; periodId?: string | null; title: string; description?: string | null; evidenceType: string; source?: string | null; payload: JsonRecord }) {
  const checksum = hash(input.payload);
  const result = await getPool().query<{ id: string }>(
    `INSERT INTO audit_evidence (control_id, period_id, company_id, title, description, evidence_type, source, payload, checksum, collected_by_id)
     SELECT $1::uuid, $2::uuid, $10::uuid, $3, $4, $5, $6, $7::jsonb, $8, $9::uuid
     WHERE $2::uuid IS NULL OR EXISTS (SELECT 1 FROM audit_periods WHERE id = $2::uuid AND status NOT IN ('locked','archived') AND ($10::uuid IS NULL OR company_id = $10::uuid))
     RETURNING id`,
    [input.controlId, input.periodId ?? null, input.title, input.description ?? null, input.evidenceType, input.source ?? null, JSON.stringify(input.payload), checksum, actor.id, actor.companyId ?? null],
  );
  if (!result.rowCount) throw new Error('Evidence cannot be added to a locked or missing period');
  await recordAuditEvent({ action: 'evidence.collected', message: `Evidence '${input.title}' collected.`, source: 'AuditGovernance', actorUserId: actor.id, entityType: 'AuditEvidence', entityId: result.rows[0].id, afterValue: { ...input, checksum } });
  return { id: result.rows[0].id, checksum };
}

export async function lockAuditPeriod(actor: Actor, id: string) {
  const evidence = await getPool().query(`SELECT id, control_id, title, checksum, version, collected_at FROM audit_evidence WHERE period_id = $1::uuid ORDER BY id`, [id]);
  const manifest = { periodId: id, evidence: evidence.rows, lockedAt: new Date().toISOString() };
  const manifestHash = hash(manifest);
  const result = await getPool().query(
    `UPDATE audit_periods SET status = 'locked', locked_at = NOW(), locked_by_id = $2::uuid, manifest_hash = $3
     WHERE id = $1::uuid AND status IN ('open','fieldwork') AND ($4::uuid IS NULL OR company_id = $4::uuid) RETURNING id, name`, [id, actor.id, manifestHash, actor.companyId ?? null],
  );
  if (!result.rowCount) throw new Error('Open audit period not found');
  await recordAuditEvent({ action: 'audit_period.locked', message: `Audit period '${result.rows[0].name}' locked.`, source: 'AuditGovernance', actorUserId: actor.id, entityType: 'AuditPeriod', entityId: id, afterValue: { manifestHash, evidenceCount: evidence.rowCount } });
  return { id, manifestHash, evidenceCount: evidence.rowCount };
}

export async function buildEvidencePackage(periodId: string, actorCompanyId?: string | null) {
  const period = await getPool().query(`SELECT * FROM audit_periods WHERE id = $1::uuid AND ($2::uuid IS NULL OR company_id = $2::uuid)`, [periodId, actorCompanyId ?? null]);
  if (!period.rowCount) throw new Error('Audit period not found');
  const evidence = await getPool().query(
    `SELECT e.id, e.title, e.description, e.evidence_type, e.source, e.payload, e.checksum, e.version, e.collected_at,
      c.code AS control_code, c.title AS control_title, c.framework_refs
     FROM audit_evidence e JOIN audit_controls c ON c.id = e.control_id WHERE e.period_id = $1::uuid ORDER BY c.code, e.collected_at`, [periodId],
  );
  const auditEvents = await getPool().query(
    `SELECT id, sequence::text, occurred_at, action, outcome, entity_type, entity_id, event_hash, previous_hash
     FROM audit_events WHERE occurred_at BETWEEN $1 AND $2 ORDER BY sequence`, [period.rows[0].starts_at, period.rows[0].ends_at],
  );
  const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(), period: period.rows[0], evidence: evidence.rows, auditEvents: auditEvents.rows };
  return { ...manifest, packageChecksum: hash(manifest) };
}

export async function recordAssuranceEvidence(actor: Actor, input: { kind: 'recovery_test' | 'change_release' | 'penetration_test' | 'incident_exercise'; reference: string; status: string; occurredAt: string; payload: JsonRecord; approverUserId?: string | null }) {
  const checksum = hash(input.payload);
  const result = await getPool().query<{ id: string }>(
    `INSERT INTO audit_assurance_evidence (kind, reference, status, occurred_at, owner_user_id, approver_user_id, company_id, payload, checksum)
     VALUES ($1, $2, $3, $4::timestamptz, $5::uuid, $6::uuid, $7::uuid, $8::jsonb, $9) RETURNING id`,
    [input.kind, input.reference, input.status, input.occurredAt, actor.id, input.approverUserId ?? null, actor.companyId ?? null, JSON.stringify(input.payload), checksum],
  );
  await recordAuditEvent({ action: `assurance.${input.kind}_recorded`, message: `${input.kind.replaceAll('_', ' ')} evidence '${input.reference}' recorded.`, source: 'AuditGovernance', actorUserId: actor.id, entityType: 'AuditAssuranceEvidence', entityId: result.rows[0].id, afterValue: { ...input, checksum } });
  return { id: result.rows[0].id, checksum };
}

export async function completePrivacyRequest(actor: Actor, input: { requestId: string; decision: string; fulfillment: JsonRecord }) {
  const completed = await withDbTransaction(async client => {
    const request = await client.query<{ request_type: string; identity_confirmed: boolean; status: string }>(
      `SELECT request_type, identity_confirmed, status FROM hr_privacy_requests
       WHERE id = $1::uuid AND ($2::uuid IS NULL OR company_id = $2::uuid) FOR UPDATE`, [input.requestId, actor.companyId ?? null],
    );
    if (!request.rowCount) throw new Error('Privacy request not found');
    if (!request.rows[0].identity_confirmed) throw new Error('Identity must be verified before fulfillment');
    if (['completed', 'closed', 'withdrawn'].includes(request.rows[0].status)) throw new Error('Privacy request is already final');
    const receipt = {
      requestId: input.requestId, requestType: request.rows[0].request_type, decision: input.decision,
      fulfillment: input.fulfillment, completedAt: new Date().toISOString(), completedBy: actor.id,
    };
    const receiptHash = hash(receipt);
    await client.query(
      `UPDATE hr_privacy_requests SET status = 'completed', decision = $2, completed_at = NOW(), updated_at = NOW(), version = version + 1
       WHERE id = $1::uuid`, [input.requestId, input.decision],
    );
    await client.query(
      `INSERT INTO hr_privacy_request_activities (id, request_id, actor_user_id, action, message, visibility)
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, 'fulfilled', $3, 'internal')`,
      [input.requestId, actor.id, `Fulfillment receipt ${receiptHash}`],
    );
    const control = await client.query<{ id: string }>(`SELECT id FROM audit_controls WHERE code = 'PRV-01'`);
    if (control.rowCount) {
      await client.query(
        `INSERT INTO audit_evidence (control_id, company_id, title, description, evidence_type, source, payload, checksum, collected_by_id)
         VALUES ($1::uuid, $2::uuid, $3, $4, 'privacy_fulfillment', 'privacy_request', $5::jsonb, $6, $7::uuid)`,
        [control.rows[0].id, actor.companyId ?? null, `Privacy request ${input.requestId} fulfillment`, input.decision, JSON.stringify(receipt), receiptHash, actor.id],
      );
    }
    return { receiptHash };
  });
  await recordAuditEvent({ action: 'privacy_request.fulfilled', message: `Privacy request ${input.requestId} fulfilled.`, source: 'AuditGovernance', actorUserId: actor.id, companyId: actor.companyId, entityType: 'PrivacyRequest', entityId: input.requestId, reason: input.decision, afterValue: { receiptHash: completed.receiptHash, fulfillment: input.fulfillment } });
  return completed;
}

export async function runScheduledAuditGovernance() {
  const administrators = await getPool().query<{ id: string; name: string }>(
    `SELECT id, name FROM "User" WHERE role = 'Admin' AND is_active = true ORDER BY "createdAt" LIMIT 2`,
  );
  if (!administrators.rowCount) throw new Error('No active administrator is available for scheduled controls');
  const systemActor: Actor = { id: administrators.rows[0].id, name: 'Audit scheduler' };
  const deadLetters = await retryAuditDeadLetters();
  const archive = await deliverAuditArchiveOutbox();
  const scan = await runControlScan(systemActor);
  const policies = await getPool().query<{ id: string; record_type: string; retention_days: number; action: string }>(
    `SELECT id, record_type, retention_days, action FROM hr_retention_policies WHERE is_active = true AND action IN ('auto_delete','auto_anonymize')`,
  );
  const retention: JsonRecord[] = [];
  for (const policy of policies.rows) {
    if (policy.action === 'auto_anonymize') {
      retention.push({
        policyId: policy.id,
        status: 'skipped',
        reason: 'anonymizer_not_registered',
      });
      await recordAuditEvent({
        action: 'retention.anonymization_skipped',
        outcome: 'denied',
        message: `Automatic anonymization for ${policy.record_type} was blocked because no approved field-level anonymizer is registered.`,
        source: 'AuditGovernance',
        actorUserId: systemActor.id,
        entityType: 'RetentionPolicy',
        entityId: policy.id,
        afterValue: { recordType: policy.record_type, policyAction: policy.action },
      });
      continue;
    }
    if (!RETENTION_PROCESSORS[policy.record_type]) {
      retention.push({ policyId: policy.id, status: 'skipped', reason: 'processor_not_registered' });
      continue;
    }
    const cutoffAt = new Date(Date.now() - policy.retention_days * 86400000).toISOString();
    try {
      const requested = await createRetentionExecution(systemActor, { policyId: policy.id, recordType: policy.record_type, cutoffAt, mode: 'execute' });
      if (administrators.rows.length < 2) {
        retention.push({ policyId: policy.id, executionId: requested.id, status: 'awaiting_independent_approval' });
        continue;
      }
      const approver: Actor = { id: administrators.rows[1].id, name: administrators.rows[1].name };
      await approveRetentionExecution(approver, requested.id);
      retention.push(await runRetentionExecution(systemActor, requested.id));
    } catch (error) {
      retention.push({ policyId: policy.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { completedAt: new Date().toISOString(), deadLetters, archive, scan, retention };
}
