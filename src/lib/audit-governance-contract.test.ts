import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8');

describe('audit governance platform contract', () => {
  const migration = read('prisma', 'migrations-legacy', '20260802153000_add_audit_governance_platform', 'migration.sql');
  const preservationMigration = read('prisma', 'migrations', '20260815073000_restore_business_constraints', 'migration.sql');

  it('creates the canonical evidence and governance records', () => {
    for (const table of [
      'audit_events', 'audit_event_dead_letters', 'audit_archive_outbox', 'audit_legal_holds', 'audit_retention_executions',
      'audit_retention_execution_items', 'audit_access_review_campaigns', 'audit_access_review_items', 'audit_sod_rules', 'audit_controls',
      'audit_periods', 'audit_evidence', 'audit_exceptions', 'audit_assurance_evidence',
    ]) expect(migration).toContain(`CREATE TABLE "${table}"`);
  });

  it('enforces append-only events and locked-period evidence in the database', () => {
    expect(migration).toContain('CREATE TRIGGER "audit_events_immutable"');
    expect(migration).toContain("RAISE EXCEPTION 'audit records are append-only'");
    expect(migration).toContain('CREATE TRIGGER "audit_evidence_locked_period_guard"');
    expect(migration).toContain("evidence in a locked audit period is immutable");
    expect(preservationMigration).toContain('CREATE TRIGGER "audit_events_immutable"');
    expect(preservationMigration).toContain('CREATE TRIGGER "audit_evidence_locked_period_guard"');
  });

  it('exposes role-scoped operations and a scheduled control endpoint', () => {
    const modules = read('src', 'lib', 'platform-modules', 'logging-audit-platform-modules.ts');
    const route = read('src', 'app', 'api', 'audit-governance', 'route.ts');
    const scheduled = read('src', 'app', 'api', 'audit-governance', 'scheduled', 'route.ts');
    for (const permission of ['AUDIT_CONTROLS_VIEW', 'AUDIT_EVIDENCE_MANAGE', 'AUDIT_ACCESS_REVIEW_MANAGE', 'AUDIT_RETENTION_MANAGE', 'AUDIT_PERIOD_LOCK']) {
      expect(modules).toContain(permission);
    }
    expect(route).toContain("z.literal('create_legal_hold')");
    expect(route).toContain("z.literal('create_access_review')");
    expect(route).toContain("z.literal('lock_period')");
    expect(scheduled).toContain('requireAutomationApiKey');
  });

  it('durably hands events to an immutable archive and fails closed for unregistered anonymizers', () => {
    const auditLog = read('src', 'lib', 'auditLog.ts');
    const governance = read('src', 'lib', 'audit-governance.ts');
    expect(auditLog).toContain('INSERT INTO audit_archive_outbox');
    expect(auditLog).toContain("createHmac('sha256'");
    expect(auditLog).toContain("status = 'failed'");
    expect(governance).toContain("policy.action === 'auto_anonymize'");
    expect(governance).toContain("reason: 'anonymizer_not_registered'");
    expect(governance).toContain("action: 'retention.anonymization_skipped'");
  });
});
