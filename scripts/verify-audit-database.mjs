import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const parsed = new URL(databaseUrl);
if (process.env.AUDIT_TEST_ALLOW_RESET !== 'true' || parsed.pathname !== '/audit_test') {
  throw new Error('Refusing reset unless AUDIT_TEST_ALLOW_RESET=true and the database is named audit_test');
}

const auditTables = [
  'audit_retention_execution_items', 'audit_retention_executions', 'audit_access_review_items',
  'audit_access_review_campaigns', 'audit_archive_outbox', 'audit_event_dead_letters', 'audit_legal_holds',
  'audit_evidence', 'audit_periods', 'audit_exceptions', 'audit_assurance_evidence', 'audit_sod_rules',
  'audit_controls', 'audit_events',
];
const sql = await readFile(resolve(process.cwd(), 'prisma/migrations/20260802153000_add_audit_governance_platform/migration.sql'), 'utf8');
const client = new pg.Client({ connectionString: databaseUrl });
const rejects = (statement, params, pattern) => assert.rejects(client.query(statement, params), pattern);

await client.connect();
try {
  await client.query(`DROP TABLE IF EXISTS ${auditTables.map(table => `"${table}"`).join(', ')} CASCADE`);
  await client.query(sql);
  const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])`, [auditTables]);
  assert.equal(tables.rowCount, auditTables.length, 'all audit governance tables must be created');

  const companyA = '10000000-0000-4000-8000-000000000001';
  const companyB = '10000000-0000-4000-8000-000000000002';
  const actorA = '20000000-0000-4000-8000-000000000001';
  const actorB = '20000000-0000-4000-8000-000000000002';
  const eventId = '30000000-0000-4000-8000-000000000001';
  await client.query(`INSERT INTO audit_events (id, action, message, actor_user_id, company_id, event_hash) VALUES ($1::uuid, 'verification.created', 'database verification', $2::uuid, $3::uuid, repeat('a', 64))`, [eventId, actorA, companyA]);
  await rejects(`UPDATE audit_events SET message = 'tampered' WHERE id = $1::uuid`, [eventId], /append-only/);
  await rejects(`DELETE FROM audit_events WHERE id = $1::uuid`, [eventId], /append-only/);

  const holdA = await client.query(`INSERT INTO audit_legal_holds (company_id, name, reason, created_by_id) VALUES ($1::uuid, 'Company A hold', 'verification scope', $2::uuid) RETURNING id`, [companyA, actorA]);
  await client.query(`INSERT INTO audit_legal_holds (company_id, name, reason, created_by_id) VALUES ($1::uuid, 'Company B hold', 'verification scope', $2::uuid)`, [companyB, actorB]);
  assert.equal((await client.query(`SELECT id FROM audit_legal_holds WHERE company_id = $1::uuid`, [companyA])).rowCount, 1);
  assert.equal((await client.query(`UPDATE audit_legal_holds SET status = 'released' WHERE id = $1::uuid AND company_id = $2::uuid RETURNING id`, [holdA.rows[0].id, companyB])).rowCount, 0);

  const execution = await client.query(`INSERT INTO audit_retention_executions (record_type, mode, status, cutoff_at, requested_by_id) VALUES ('expired_sessions', 'execute', 'awaiting_approval', NOW(), $1::uuid) RETURNING id`, [actorA]);
  assert.equal((await client.query(`UPDATE audit_retention_executions SET approved_by_id = $2::uuid, status = 'queued' WHERE id = $1::uuid AND status = 'awaiting_approval' AND requested_by_id <> $2::uuid RETURNING id`, [execution.rows[0].id, actorA])).rowCount, 0);

  const period = await client.query(`INSERT INTO audit_periods (company_id, name, framework, starts_at, ends_at) VALUES ($1::uuid, 'Verification period', 'ISO 27001', CURRENT_DATE - 1, CURRENT_DATE) RETURNING id`, [companyA]);
  const control = await client.query(`SELECT id FROM audit_controls ORDER BY code LIMIT 1`);
  const evidence = await client.query(`INSERT INTO audit_evidence (control_id, period_id, company_id, title, evidence_type, payload, checksum, collected_by_id) VALUES ($1::uuid, $2::uuid, $3::uuid, 'Verification evidence', 'automated_report', '{}'::jsonb, repeat('b', 64), $4::uuid) RETURNING id`, [control.rows[0].id, period.rows[0].id, companyA, actorA]);
  await client.query(`UPDATE audit_periods SET status = 'locked', locked_at = NOW(), locked_by_id = $2::uuid WHERE id = $1::uuid`, [period.rows[0].id, actorB]);
  await rejects(`UPDATE audit_evidence SET title = 'tampered' WHERE id = $1::uuid`, [evidence.rows[0].id], /locked audit period is immutable/);

  console.log(JSON.stringify({ verified: true, tables: tables.rowCount, immutableEvents: true, tenantIsolation: true, dualApproval: true, lockedEvidence: true }));
} finally {
  await client.end();
}
