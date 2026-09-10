# Audit Governance

**Status:** Implemented; production operation requires the configuration and recurring evidence listed below  
**Audience:** Security, privacy, internal audit, external auditors, control owners, and platform operations

## Control architecture

The Audit & Controls workspace at `/audit-controls` provides a single operational surface for:

- canonical append-only audit events with SHA-256 chain verification;
- durable recovery of failed audit writes;
- retention previews, independent approval, legal-hold enforcement, and disposal receipts;
- quarterly access certification, risk flags, segregation-of-duties detection, and session revocation;
- a framework-mapped control catalogue, checksummed evidence, locked periods, and evidence packages;
- continuous control exceptions; and
- recovery, release, penetration-test, and incident-exercise evidence.

The database migration `20260802153000_add_audit_governance_platform` must be applied before deploying application code that writes canonical events. During a rolling deployment, the existing `LogEntry` table remains a compatibility mirror and fallback. It is not the authoritative audit record.

## Permissions

| Permission | Purpose |
| --- | --- |
| `AUDIT_CONTROLS_VIEW` | Read controls and scoped evidence |
| `AUDIT_EVIDENCE_MANAGE` | Collect evidence and manage exceptions |
| `AUDIT_ACCESS_REVIEW_MANAGE` | Launch and decide access reviews |
| `AUDIT_RETENTION_MANAGE` | Manage legal holds and retention executions |
| `AUDIT_PERIOD_LOCK` | Finalize evidence manifests |
| `LOGS_EXPORT` | Export audit packages |

Do not assign evidence-management and period-lock permissions to the same non-admin role. The seeded SoD rules report that conflict. External auditors should receive only `AUDIT_CONTROLS_VIEW` and, when contractually approved, `LOGS_EXPORT`.

## Audit event integrity

`audit_events` is protected by a database trigger that rejects updates and deletes. Writers serialize events deterministically and include the preceding event hash. Inserts take a transaction-scoped advisory lock so concurrent requests cannot fork the chain.

Run chain verification from the workspace before creating an evidence package. Any broken chain is a critical incident. Preserve the database and storage snapshots, restrict exports, and investigate before repairing operational data. Never update an audit event to “fix” the chain.

Failed canonical writes enter `audit_event_dead_letters`; the daily scheduled-control job retries them with exponential backoff. Monitoring raises an exception while pending recovery records exist.

Every canonical insert also creates an `audit_archive_outbox` row in the same transaction. Configure `AUDIT_ARCHIVE_URL` and `AUDIT_ARCHIVE_HMAC_SECRET` so the scheduler delivers signed canonical events to a separately administered receiver backed by object-lock/WORM storage. Delivery receipts are retained, failures retry with exponential backoff, and repeated failures become critical control exceptions. The receiver—not this application—must enforce the immutable storage retention policy.

## Retention and legal hold

Only registered processors may delete records. A retention request follows this sequence:

1. Preview candidate count.
2. Request execution.
3. Obtain approval from a different user.
4. Recheck legal holds inside the execution transaction.
5. Delete eligible operational records.
6. Store a checksummed receipt and immutable audit event.

Supported initial processors are audit dead letters, completed data operations, webhook delivery logs, completed upload jobs, expired sessions, and screening results. Add new processors explicitly after legal, privacy, storage, backup, and referential-integrity review. Never construct processor table names from user input.

Policies with action `auto_delete` are considered pre-authorized for scheduled execution, but the scheduler still requires two active administrators for independent request and approval. With one administrator, the execution remains awaiting approval. Any matching active legal hold blocks execution. `auto_anonymize` fails closed and records a denied audit event until a record-specific, field-level anonymizer has been registered and approved; it is never treated as deletion.

Run `npm run audit:verify-database` only against a disposable database named `audit_test` with `AUDIT_TEST_ALLOW_RESET=true`. The verifier recreates the audit migration and proves append-only events, company-scoped mutations, independent retention approval, and locked-period evidence.

## Scheduled controls

Deploy `k8s/06-audit-governance-cronjob.yaml` or invoke the following endpoint daily from the platform scheduler:

```text
POST /api/audit-governance/scheduled
Authorization: Bearer <AUTOMATION_API_KEY>
```

The job retries failed audit events, runs continuous detectors, records the scan as assurance evidence, and processes explicitly automatic retention policies. Alert on any non-2xx response or missed daily run.

## CI/CD evidence

After a successful production deployment, CI can record the release:

```bash
AUDIT_ASSURANCE_URL=https://hr.example.com/api/audit-governance/assurance \
AUTOMATION_API_KEY=... \
AUDIT_ASSURANCE_REFERENCE="$CI_COMMIT_SHA" \
npm run audit:submit-assurance
```

Record the pipeline URL, commit, immutable image digest, environment, approver, test results, vulnerability scan, migration result, and rollback reference in the payload. Failed builds must not be submitted as successful release evidence.

## Recovery and external assessment

- Define approved RPO and RTO values outside the application and include them in every recovery-test payload.
- Perform a database and object-storage restoration at least quarterly.
- Record start time, recovery point, completion time, integrity checks, exceptions, owner, and independent approver.
- Run an independent penetration test annually and after material authentication or tenant-isolation changes.
- Complete authenticated cross-company authorization and privacy-masking tests before an external assessment.
- Lock the audit period only after the evidence owner and independent reviewer reconcile the manifest.
- Export the JSON evidence package and verify its `packageChecksum` before transfer through the auditor-approved channel.

The platform creates and preserves evidence; organizational certification still requires approved policies, trained control owners, actual recurring operation, and independent assessment.
