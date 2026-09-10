import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, createHmac } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { getSafeDbClient, withDbTransaction } from './db';

export type AuditLogDetails = Record<string, unknown>;
export type AuditOutcome = 'success' | 'failure' | 'denied' | 'partial' | 'unknown';

export interface AuditRequestContext {
  requestId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  companyId?: string | null;
  impersonatorId?: string | null;
}

export interface AuditEventInput extends AuditRequestContext {
  level?: 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';
  action: string;
  outcome?: AuditOutcome;
  message: string;
  source?: string | null;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  reason?: string | null;
  beforeValue?: unknown;
  afterValue?: unknown;
  metadata?: AuditLogDetails | null;
  occurredAt?: Date | string;
}

export interface AuditWriteResult {
  id: string;
  eventHash: string;
  persisted: boolean;
  fallback: boolean;
}

const auditContext = new AsyncLocalStorage<AuditRequestContext>();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IP_PATTERN = /^(?:\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f:]+)$/i;
const CONTEXT_DETAIL_KEYS = new Set(['requestId', 'correlationId', 'ipAddress', 'userAgent', 'companyId']);
const SENSITIVE_KEY_PATTERN = /password|secret|token|authorization|cookie|session[_-]?key|api[_-]?key|backup[_-]?code/i;

function asUuid(value: unknown): string | null {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null;
}

function asLimitedString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function asIpAddress(value: unknown): string | null {
  const candidate = asLimitedString(value, 64);
  return candidate && IP_PATTERN.test(candidate) ? candidate : null;
}

export function canonicalizeAuditValue(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeAuditValue).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalizeAuditValue(item)}`)
    .join(',')}}`;
}

export function computeAuditHash(value: unknown): string {
  return createHash('sha256').update(canonicalizeAuditValue(value)).digest('hex');
}

export function sanitizeAuditValue(value: unknown, key = '', depth = 0, seen = new WeakSet<object>()): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) return '[REDACTED]';
  if (value === null || value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value ?? null;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (depth >= 12) return '[MAX_DEPTH]';
  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 1000).map(item => sanitizeAuditValue(item, key, depth + 1, seen));
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 1000).map(([entryKey, item]) => [entryKey, sanitizeAuditValue(item, entryKey, depth + 1, seen)]));
}

function cleanMetadata(details: AuditLogDetails | null | undefined): AuditLogDetails {
  return Object.fromEntries(Object.entries(details ?? {}).filter(([key]) => !CONTEXT_DETAIL_KEYS.has(key)));
}

function detailsContext(details: AuditLogDetails | null | undefined): AuditRequestContext {
  return {
    requestId: asLimitedString(details?.requestId, 160),
    correlationId: asLimitedString(details?.correlationId, 160),
    ipAddress: asIpAddress(details?.ipAddress),
    userAgent: asLimitedString(details?.userAgent, 1000),
    companyId: asUuid(details?.companyId),
  };
}

function mergeContext(input: AuditEventInput): AuditEventInput {
  const current = auditContext.getStore() ?? {};
  return {
    ...input,
    beforeValue: sanitizeAuditValue(input.beforeValue),
    afterValue: sanitizeAuditValue(input.afterValue),
    metadata: sanitizeAuditValue(input.metadata ?? {}) as AuditLogDetails,
    requestId: input.requestId ?? current.requestId ?? null,
    correlationId: input.correlationId ?? current.correlationId ?? null,
    ipAddress: input.ipAddress ?? current.ipAddress ?? null,
    userAgent: input.userAgent ?? current.userAgent ?? null,
    companyId: input.companyId ?? current.companyId ?? null,
    impersonatorId: input.impersonatorId ?? current.impersonatorId ?? null,
  };
}

export function auditContextFromRequest(request: NextRequest | Request): AuditRequestContext {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return {
    requestId: asLimitedString(request.headers.get('x-request-id'), 160) ?? uuidv4(),
    correlationId: asLimitedString(request.headers.get('x-correlation-id'), 160),
    ipAddress: asIpAddress(forwarded ?? request.headers.get('x-real-ip')),
    userAgent: asLimitedString(request.headers.get('user-agent'), 1000),
    // Company scope must come from the authenticated server-side session, never a caller-controlled header.
    companyId: null,
  };
}

export function runWithAuditContext<T>(context: AuditRequestContext, operation: () => T): T {
  return auditContext.run(context, operation);
}

async function appendCanonicalAuditEvent(input: AuditEventInput): Promise<AuditWriteResult> {
  const event = mergeContext(input);
  const id = uuidv4();
  const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date();
  const metadata = event.metadata ?? {};

  return withDbTransaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['canonical-audit-chain-v1']);
    const previousResult = await client.query<{ event_hash: string }>(
      'SELECT event_hash FROM audit_events ORDER BY sequence DESC LIMIT 1',
    );
    const previousHash = previousResult.rows[0]?.event_hash ?? null;
    const hashPayload = {
      id,
      occurredAt: occurredAt.toISOString(),
      level: event.level ?? 'AUDIT',
      action: event.action,
      outcome: event.outcome ?? 'success',
      message: event.message,
      source: event.source ?? null,
      actorUserId: asUuid(event.actorUserId),
      impersonatorId: asUuid(event.impersonatorId),
      companyId: asUuid(event.companyId),
      entityType: asLimitedString(event.entityType, 120),
      entityId: asLimitedString(event.entityId, 200),
      requestId: asLimitedString(event.requestId, 160),
      correlationId: asLimitedString(event.correlationId, 160),
      ipAddress: asIpAddress(event.ipAddress),
      userAgent: asLimitedString(event.userAgent, 1000),
      reason: event.reason ?? null,
      beforeValue: event.beforeValue ?? null,
      afterValue: event.afterValue ?? null,
      metadata,
      previousHash,
      schemaVersion: 1,
    };
    const eventHash = computeAuditHash(hashPayload);

    await client.query(
      `INSERT INTO audit_events
        (id, occurred_at, level, action, outcome, message, source, actor_user_id,
         impersonator_id, company_id, entity_type, entity_id, request_id, correlation_id,
         ip_address, user_agent, reason, before_value, after_value, metadata,
         previous_hash, event_hash, schema_version)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8::uuid, $9::uuid, $10::uuid, $11, $12,
         $13, $14, $15::inet, $16, $17, $18::jsonb, $19::jsonb, $20::jsonb, $21, $22, 1)`,
      [
        id, occurredAt, hashPayload.level, hashPayload.action, hashPayload.outcome,
        hashPayload.message, hashPayload.source, hashPayload.actorUserId,
        hashPayload.impersonatorId, hashPayload.companyId, hashPayload.entityType,
        hashPayload.entityId, hashPayload.requestId, hashPayload.correlationId,
        hashPayload.ipAddress, hashPayload.userAgent, hashPayload.reason,
        JSON.stringify(hashPayload.beforeValue), JSON.stringify(hashPayload.afterValue),
        JSON.stringify(metadata), previousHash, eventHash,
      ],
    );

    await client.query(
      `INSERT INTO audit_archive_outbox (event_id, payload)
       VALUES ($1::uuid, $2::jsonb) ON CONFLICT (event_id) DO NOTHING`,
      [id, JSON.stringify({ ...hashPayload, eventHash })],
    );

    return { id, eventHash, persisted: true, fallback: false };
  });
}

async function writeLegacyMirror(input: AuditEventInput) {
  const client = await getSafeDbClient();
  try {
    await client.query(
      `INSERT INTO "LogEntry" (id, timestamp, level, message, source, "actingUserId", details, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6::uuid, $7::jsonb, NOW())`,
      [uuidv4(), input.occurredAt ? new Date(input.occurredAt) : new Date(), input.level ?? 'AUDIT', input.message,
        input.source ?? null, asUuid(input.actorUserId), JSON.stringify(input.metadata ?? {})],
    );
  } finally {
    client.release();
  }
}

async function writeDeadLetter(input: AuditEventInput, error: unknown): Promise<boolean> {
  const client = await getSafeDbClient().catch(() => null);
  if (!client) return false;
  try {
    await client.query(
      `INSERT INTO audit_event_dead_letters (payload, error, next_attempt_at)
       VALUES ($1::jsonb, $2, NOW() + INTERVAL '5 minutes')`,
      [JSON.stringify(input), error instanceof Error ? error.message : String(error)],
    );
    return true;
  } catch {
    return false;
  } finally {
    client.release();
  }
}

export async function recordAuditEvent(input: AuditEventInput): Promise<AuditWriteResult> {
  const event = mergeContext(input);
  try {
    const result = await appendCanonicalAuditEvent(event);
    void writeLegacyMirror(event).catch(error => console.error('[AUDIT MIRROR] Failed:', error));
    void deliverAuditArchiveOutbox(10).catch(error => console.error('[AUDIT ARCHIVE] Delivery failed:', error));
    return result;
  } catch (error) {
    const queued = await writeDeadLetter(event, error);
    try {
      await writeLegacyMirror({ ...event, metadata: { ...(event.metadata ?? {}), canonicalWriteFailed: true } });
    } catch (legacyError) {
      console.error('CRITICAL: all audit persistence paths failed', { error, legacyError, event });
    }
    return { id: uuidv4(), eventHash: '', persisted: false, fallback: queued };
  }
}

export async function logAudit(
  level: 'INFO' | 'WARN' | 'ERROR' | 'AUDIT',
  message: string,
  source: string,
  actingUserId: string | null = null,
  details: AuditLogDetails | null = null,
  impersonatorId: string | null = null,
) {
  const context = detailsContext(details);
  const action = asLimitedString(details?.action, 160) ?? source;
  return recordAuditEvent({
    level,
    action,
    outcome: (details?.outcome as AuditOutcome | undefined) ?? (level === 'ERROR' ? 'failure' : 'success'),
    message,
    source,
    actorUserId: actingUserId,
    impersonatorId,
    entityType: asLimitedString(details?.entity ?? details?.entityType, 120),
    entityId: asLimitedString(details?.entityId, 200),
    beforeValue: details?.beforeValue,
    afterValue: details?.afterValue,
    reason: asLimitedString(details?.reason, 4000),
    metadata: cleanMetadata(details),
    ...context,
  });
}

export async function logAuditEvent(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details: AuditLogDetails | null = null,
  impersonatorId: string | null = null,
) {
  return recordAuditEvent({
    level: 'AUDIT',
    action,
    message: `${action} on ${entity} (${entityId})`,
    source: `logAuditEvent:${entity}`,
    actorUserId: userId,
    impersonatorId,
    entityType: entity,
    entityId,
    beforeValue: details?.beforeValue,
    afterValue: details?.afterValue,
    reason: asLimitedString(details?.reason, 4000),
    metadata: cleanMetadata(details),
    ...detailsContext(details),
  });
}

export async function verifyAuditChain(limit = 100_000) {
  const client = await getSafeDbClient();
  try {
    const result = await client.query<Record<string, unknown>>(
      `SELECT id, occurred_at, level, action, outcome, message, source, actor_user_id,
              impersonator_id, company_id, entity_type, entity_id, request_id, correlation_id,
              host(ip_address) AS ip_address, user_agent, reason, before_value, after_value,
              metadata, previous_hash, event_hash, schema_version
         FROM audit_events ORDER BY sequence ASC LIMIT $1`,
      [Math.min(Math.max(limit, 1), 1_000_000)],
    );
    let previousHash: string | null = null;
    for (const row of result.rows) {
      const payload = {
        id: row.id,
        occurredAt: new Date(row.occurred_at as string).toISOString(),
        level: row.level,
        action: row.action,
        outcome: row.outcome,
        message: row.message,
        source: row.source,
        actorUserId: row.actor_user_id,
        impersonatorId: row.impersonator_id,
        companyId: row.company_id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        requestId: row.request_id,
        correlationId: row.correlation_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        reason: row.reason,
        beforeValue: row.before_value,
        afterValue: row.after_value,
        metadata: row.metadata,
        previousHash,
        schemaVersion: row.schema_version,
      };
      if (row.previous_hash !== previousHash || row.event_hash !== computeAuditHash(payload)) {
        return { valid: false, checked: result.rows.indexOf(row) + 1, brokenEventId: row.id };
      }
      previousHash = String(row.event_hash);
    }
    return { valid: true, checked: result.rows.length, headHash: previousHash };
  } finally {
    client.release();
  }
}

/** Deliver canonical events to a separately administered object-lock/WORM receiver. */
export async function deliverAuditArchiveOutbox(batchSize = 100) {
  const endpoint = process.env.AUDIT_ARCHIVE_URL?.trim();
  const secret = process.env.AUDIT_ARCHIVE_HMAC_SECRET?.trim();
  if (!endpoint || !secret) return { configured: false, attempted: 0, delivered: 0, failed: 0 };
  if (secret.length < 32) throw new Error('AUDIT_ARCHIVE_HMAC_SECRET must contain at least 32 characters');

  const client = await getSafeDbClient();
  try {
    const claimed = await client.query<{ id: string; event_id: string; payload: AuditLogDetails; attempts: number }>(
      `UPDATE audit_archive_outbox outbox SET status = 'delivering', attempts = attempts + 1
       FROM (SELECT id FROM audit_archive_outbox
         WHERE status IN ('pending','failed') AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
         ORDER BY created_at LIMIT $1 FOR UPDATE SKIP LOCKED) candidate
       WHERE outbox.id = candidate.id
       RETURNING outbox.id, outbox.event_id, outbox.payload, outbox.attempts`,
      [Math.min(Math.max(batchSize, 1), 500)],
    );
    let delivered = 0;
    for (const item of claimed.rows) {
      const body = canonicalizeAuditValue(item.payload);
      const signature = createHmac('sha256', secret).update(body).digest('hex');
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-audit-event-id': item.event_id, 'x-audit-signature-sha256': signature },
          body,
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`Archive returned HTTP ${response.status}`);
        const receipt = await response.json().catch(() => ({ accepted: true, status: response.status }));
        await client.query(
          `UPDATE audit_archive_outbox SET status = 'delivered', delivered_at = NOW(), next_attempt_at = NULL,
             last_error = NULL, receipt = $2::jsonb WHERE id = $1::uuid`,
          [item.id, JSON.stringify(receipt)],
        );
        delivered += 1;
      } catch (error) {
        await client.query(
          `UPDATE audit_archive_outbox SET status = 'failed', last_error = $2,
             next_attempt_at = NOW() + make_interval(mins => LEAST(1440, CAST(POWER(2, LEAST(attempts, 10)) AS int)))
           WHERE id = $1::uuid`,
          [item.id, error instanceof Error ? error.message : String(error)],
        );
      }
    }
    const attempted = claimed.rowCount ?? claimed.rows.length;
    return { configured: true, attempted, delivered, failed: attempted - delivered };
  } finally {
    client.release();
  }
}

export async function retryAuditDeadLetters(batchSize = 100) {
  const client = await getSafeDbClient();
  try {
    const pending = await client.query<{ id: string; payload: AuditEventInput; attempts: number }>(
      `SELECT id, payload, attempts FROM audit_event_dead_letters
       WHERE status = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
       ORDER BY created_at LIMIT $1`, [Math.min(Math.max(batchSize, 1), 500)],
    );
    let recovered = 0;
    for (const item of pending.rows) {
      try {
        await appendCanonicalAuditEvent(item.payload);
        await client.query(`UPDATE audit_event_dead_letters SET status = 'resolved', resolved_at = NOW(), attempts = attempts + 1 WHERE id = $1::uuid`, [item.id]);
        recovered += 1;
      } catch (error) {
        const attempts = item.attempts + 1;
        await client.query(
          `UPDATE audit_event_dead_letters SET attempts = $2, error = $3,
             status = CASE WHEN $2 >= 10 THEN 'failed' ELSE 'pending' END,
             next_attempt_at = NOW() + make_interval(mins => LEAST(1440, CAST(POWER(2, LEAST($2, 10)) AS int)))
           WHERE id = $1::uuid`,
          [item.id, attempts, error instanceof Error ? error.message : String(error)],
        );
      }
    }
    const attempted = pending.rowCount ?? pending.rows.length;
    return { attempted, recovered, failed: attempted - recovered };
  } finally {
    client.release();
  }
}
