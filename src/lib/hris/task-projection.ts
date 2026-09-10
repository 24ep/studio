import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { HrWorkflowAction } from '@/lib/hr/hr-workflows';
import type { HrisAction, HrisStatus, HrisTask, HrisTaskFilter, HrisTaskPage, HrisTaskPriority } from './workspace-contracts';
import { normalizeHrisTaskFilter } from './workspace-contracts';

type TaskRow = Record<string, unknown>;
type TaskProjectionClient = Pick<Prisma.TransactionClient, '$queryRawUnsafe' | '$executeRawUnsafe'>;

export type HrisDecisionHandler = {
  kind: 'hr_workflow';
  action: HrWorkflowAction;
};

export interface HrisProjectedTask extends HrisTask {
  decisionHandlers: Record<string, HrisDecisionHandler>;
}

export interface HrisTaskProjectionInput {
  companyId?: string | null;
  taskType: string;
  sourceDomain: string;
  sourceType: string;
  sourceId: string;
  subject: string;
  summary?: string | null;
  requesterUserId?: string | null;
  requesterName?: string | null;
  assigneeUserId?: string | null;
  assigneeName?: string | null;
  companyName?: string | null;
  priority?: HrisTaskPriority;
  dueAt?: string | null;
  slaAt?: string | null;
  status?: HrisStatus;
  deepLink: string;
  allowedDecisions: HrisAction[];
  decisionHandlers: Record<string, HrisDecisionHandler>;
}

export function mapHrisTaskRow(row: TaskRow): HrisProjectedTask {
  const allowedDecisions = arrayValue(row.allowed_decisions).map(String) as HrisAction[];
  return {
    id: String(row.id),
    taskType: String(row.task_type),
    sourceDomain: String(row.source_domain),
    sourceType: String(row.source_type),
    sourceId: String(row.source_id),
    subject: String(row.subject),
    summary: nullableString(row.summary),
    requester: row.requester_name ? { id: nullableString(row.requester_user_id), name: String(row.requester_name) } : null,
    assignee: row.assignee_name ? { id: nullableString(row.assignee_user_id), name: String(row.assignee_name) } : null,
    companyId: nullableString(row.company_id),
    companyName: nullableString(row.company_name),
    priority: String(row.priority || 'normal') as HrisTaskPriority,
    dueAt: dateString(row.due_at),
    slaAt: dateString(row.sla_at),
    status: String(row.status || 'pending') as HrisStatus,
    deepLink: String(row.deep_link),
    allowedDecisions,
    decisionHandlers: objectValue(row.decision_handlers) as Record<string, HrisDecisionHandler>,
    version: Number(row.version || 1),
    createdAt: dateString(row.created_at) || new Date(0).toISOString(),
    updatedAt: dateString(row.updated_at) || new Date(0).toISOString(),
  };
}

export async function upsertHrisTaskProjection(input: HrisTaskProjectionInput, client: TaskProjectionClient = prisma) {
  const rows = await client.$queryRawUnsafe<TaskRow[]>(
    `INSERT INTO hr_workflow_tasks (
       company_id, task_type, source_domain, source_type, source_id, subject, summary,
       requester_user_id, requester_name, assignee_user_id, assignee_name, company_name,
       priority, due_at, sla_at, status, deep_link, allowed_decisions, decision_handlers
     ) VALUES (
       $1::uuid, $2, $3, $4, $5::uuid, $6, $7, $8::uuid, $9, $10::uuid, $11, $12,
       $13, $14::timestamptz, $15::timestamptz, $16, $17, $18::jsonb, $19::jsonb
     )
     ON CONFLICT (source_domain, source_type, source_id, task_type, assignee_user_id)
     DO UPDATE SET subject = EXCLUDED.subject, summary = EXCLUDED.summary,
       requester_user_id = EXCLUDED.requester_user_id, requester_name = EXCLUDED.requester_name,
       assignee_name = EXCLUDED.assignee_name, company_name = EXCLUDED.company_name,
       priority = EXCLUDED.priority, due_at = EXCLUDED.due_at, sla_at = EXCLUDED.sla_at,
       status = EXCLUDED.status, deep_link = EXCLUDED.deep_link,
       allowed_decisions = EXCLUDED.allowed_decisions, decision_handlers = EXCLUDED.decision_handlers,
       version = hr_workflow_tasks.version + 1, updated_at = now()
     RETURNING *`,
    input.companyId ?? null,
    input.taskType,
    input.sourceDomain,
    input.sourceType,
    input.sourceId,
    input.subject,
    input.summary ?? null,
    input.requesterUserId ?? null,
    input.requesterName ?? null,
    input.assigneeUserId ?? null,
    input.assigneeName ?? null,
    input.companyName ?? null,
    input.priority ?? 'normal',
    input.dueAt ?? null,
    input.slaAt ?? null,
    input.status ?? 'pending',
    input.deepLink,
    JSON.stringify(input.allowedDecisions),
    JSON.stringify(input.decisionHandlers),
  );
  return rows[0] ? mapHrisTaskRow(rows[0]) : null;
}

export async function updateHrisTaskProjectionStatus({
  sourceDomain,
  sourceType,
  sourceId,
  status,
  client = prisma,
}: {
  sourceDomain: string;
  sourceType: string;
  sourceId: string;
  status: HrisStatus;
  client?: TaskProjectionClient;
}) {
  return client.$executeRawUnsafe(
    `UPDATE hr_workflow_tasks
        SET status = $1, version = version + 1, updated_at = now()
      WHERE source_domain = $2 AND source_type = $3 AND source_id = $4::uuid`,
    status,
    sourceDomain,
    sourceType,
    sourceId,
  );
}

export async function listHrisTaskProjections({ actorUserId, filter, allowAssigneeOverride = false }: { actorUserId: string; filter: HrisTaskFilter; allowAssigneeOverride?: boolean }): Promise<Omit<HrisTaskPage, 'records'> & { records: HrisProjectedTask[] }> {
  const normalized = normalizeHrisTaskFilter(filter);
  const values: unknown[] = [];
  const conditions: string[] = [];
  const add = (sql: string, value: unknown) => { values.push(value); conditions.push(sql.replace('?', `$${values.length}`)); };
  add('assignee_user_id = ?::uuid', allowAssigneeOverride && normalized.assigneeId ? normalized.assigneeId : actorUserId);
  if (normalized.query) { values.push(`%${normalized.query}%`); conditions.push(`(subject ILIKE $${values.length} OR summary ILIKE $${values.length})`); }
  if (normalized.statuses?.length) { values.push(normalized.statuses); conditions.push(`status = ANY($${values.length}::text[])`); }
  if (normalized.priorities?.length) { values.push(normalized.priorities); conditions.push(`priority = ANY($${values.length}::text[])`); }
  if (normalized.domains?.length) { values.push(normalized.domains); conditions.push(`source_domain = ANY($${values.length}::text[])`); }
  if (normalized.companyId) add('company_id = ?::uuid', normalized.companyId);
  if (normalized.dueBefore) add('due_at <= ?::timestamptz', normalized.dueBefore);
  if (normalized.cursor) { values.push(normalized.cursor); conditions.push(`(created_at, id) < (SELECT created_at, id FROM hr_workflow_tasks WHERE id = $${values.length}::uuid)`); }
  values.push((normalized.pageSize || 25) + 1);
  const rows = await prisma.$queryRawUnsafe<TaskRow[]>(
    `SELECT * FROM hr_workflow_tasks WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC, id DESC LIMIT $${values.length}`,
    ...values,
  );
  const pageSize = normalized.pageSize || 25;
  const records = rows.slice(0, pageSize).map(mapHrisTaskRow);
  return { records, nextCursor: rows.length > pageSize ? records.at(-1)?.id || null : null };
}

export async function getHrisTaskForDecision(id: string, actorUserId: string, canManageAll: boolean) {
  const rows = await prisma.$queryRawUnsafe<TaskRow[]>(
    `SELECT * FROM hr_workflow_tasks
     WHERE id = $1::uuid AND ($2::boolean OR assignee_user_id = $3::uuid)
     LIMIT 1`,
    id,
    canManageAll,
    actorUserId,
  );
  return rows[0] ? mapHrisTaskRow(rows[0]) : null;
}

export async function completeHrisTaskDecision({ id, expectedVersion, status }: { id: string; expectedVersion: number; status: HrisStatus }) {
  const rows = await prisma.$queryRawUnsafe<TaskRow[]>(
    `UPDATE hr_workflow_tasks SET status = $1, version = version + 1, updated_at = now()
     WHERE id = $2::uuid AND version = $3 RETURNING *`,
    status,
    id,
    expectedVersion,
  );
  return rows[0] ? mapHrisTaskRow(rows[0]) : null;
}

function nullableString(value: unknown) { return value === null || value === undefined || value === '' ? null : String(value); }
function dateString(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toISOString(); }
function arrayValue(value: unknown): unknown[] { if (Array.isArray(value)) return value; if (typeof value === 'string') { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } } return []; }
function objectValue(value: unknown): Record<string, unknown> { if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>; if (typeof value === 'string') { try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; } } return {}; }
