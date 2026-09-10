import { v4 as uuidv4 } from 'uuid';

import type { InstallationEnvironmentInput } from '@/lib/platform-installation';
import { initializeInstallationEnvironment } from '@/lib/demo-installation';
import { getPool } from '@/lib/db';
import prisma from '@/lib/prisma';

const ENTITY_TYPE = 'installation-environment';
const OPERATION = 'initialize';

type DemoInput = Extract<InstallationEnvironmentInput, { environment: 'demo' }>;

export async function assertInstallationOwner(userId: string) {
  const [owner, configured] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: 'platformInstalledByUserId' }, select: { value: true } }),
    prisma.systemSetting.findUnique({ where: { key: 'installationEnvironmentConfiguredAt' }, select: { value: true } }),
  ]);
  if (configured?.value) throw new Error('Installation environment has already been configured.');
  if (!owner?.value || owner.value !== userId) throw new Error('Only the administrator who created this installation can finish setup.');
}

export async function configureProductionEnvironment(userId: string) {
  await assertInstallationOwner(userId);
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('hrive-installation-environment'))`;
    const configured = await tx.systemSetting.findUnique({ where: { key: 'installationEnvironmentConfiguredAt' } });
    if (configured?.value) throw new Error('Installation environment has already been configured.');
    const activeDemoJob = await tx.dataOperationJob.findFirst({
      where: { operation: OPERATION, entityType: ENTITY_TYPE, status: { in: ['pending', 'processing'] } },
      select: { id: true },
    });
    if (activeDemoJob) throw new Error('Demo data initialization is already in progress.');
    const now = new Date().toISOString();
    await tx.systemSetting.upsert({ where: { key: 'installationEnvironment' }, update: { value: 'production' }, create: { key: 'installationEnvironment', value: 'production' } });
    await tx.systemSetting.upsert({ where: { key: 'installationEnvironmentConfiguredAt' }, update: { value: now }, create: { key: 'installationEnvironmentConfiguredAt', value: now } });
  });
  return { environment: 'production' as const, status: 'completed' as const, progress: 100 };
}

export async function enqueueDemoInstallation(input: DemoInput, requestedById: string) {
  await assertInstallationOwner(requestedById);
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT pg_advisory_xact_lock(hashtext('hrive-installation-environment'))`);
    const configured = await client.query(`SELECT value FROM "SystemSetting" WHERE key = 'installationEnvironmentConfiguredAt' AND value IS NOT NULL LIMIT 1`);
    if (configured.rows[0]) throw new Error('Installation environment has already been configured.');
    const active = await client.query(
      `SELECT id, status, progress, result, error, parameters FROM data_operation_jobs
       WHERE operation = $1 AND entity_type = $2 AND status IN ('pending', 'processing')
       ORDER BY created_at DESC LIMIT 1`, [OPERATION, ENTITY_TYPE],
    );
    if (active.rows[0]) {
      await client.query('COMMIT');
      return active.rows[0];
    }
    const id = uuidv4();
    await client.query(
      `INSERT INTO data_operation_jobs (id, operation, entity_type, status, progress, parameters, requested_by_id, created_at, updated_at)
       VALUES ($1, $2, $3, 'pending', 0, $4, $5, NOW(), NOW())`,
      [id, OPERATION, ENTITY_TYPE, input, requestedById],
    );
    await client.query('COMMIT');
    return { id, status: 'pending', progress: 0, parameters: input };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getDemoInstallationJob(jobId: string | null, requestedById: string) {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `SELECT id, status, progress, result, error, parameters, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM data_operation_jobs WHERE operation = $1 AND entity_type = $2 AND requested_by_id = $3
         AND ($4::uuid IS NULL OR id = $4::uuid) ORDER BY created_at DESC LIMIT 1`,
      [OPERATION, ENTITY_TYPE, requestedById, jobId],
    );
    return result.rows[0] || null;
  } finally { client.release(); }
}

async function updateProgress(id: string, progress: number, stage: string) {
  const client = await getPool().connect();
  try {
    await client.query(`UPDATE data_operation_jobs SET progress = $2, result = COALESCE(result, '{}'::jsonb) || jsonb_build_object('stage', $3::text), updated_at = NOW() WHERE id = $1`, [id, progress, stage]);
  } finally { client.release(); }
}

export async function processDemoInstallationQueue() {
  const client = await getPool().connect();
  let job: { id: string; requestedById: string; parameters: DemoInput } | null = null;
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE data_operation_jobs SET status = 'pending', error = NULL, updated_at = NOW()
      WHERE operation = $1 AND entity_type = $2 AND status = 'processing' AND updated_at < NOW() - INTERVAL '30 minutes'`, [OPERATION, ENTITY_TYPE]);
    const claimed = await client.query(
      `SELECT id, requested_by_id AS "requestedById", parameters FROM data_operation_jobs
       WHERE operation = $1 AND entity_type = $2 AND status = 'pending'
       ORDER BY created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1`, [OPERATION, ENTITY_TYPE],
    );
    job = claimed.rows[0] || null;
    if (job) await client.query(`UPDATE data_operation_jobs SET status = 'processing', attempts = attempts + 1, started_at = COALESCE(started_at, NOW()), updated_at = NOW() WHERE id = $1`, [job.id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
  if (!job) return;

  try {
    const result = await initializeInstallationEnvironment(job.parameters, job.requestedById, (progress, stage) => updateProgress(job!.id, progress, stage));
    const done = await getPool().connect();
    try {
      await done.query(`UPDATE data_operation_jobs SET status = 'completed', progress = 100, result = $2, completed_at = NOW(), updated_at = NOW() WHERE id = $1`, [job.id, { ...result, stage: 'Demo workspace ready' }]);
    } finally { done.release(); }
  } catch (error) {
    console.error('Demo installation background job failed:', error);
    const failed = await getPool().connect();
    try {
      const message = 'Demo initialization stopped before completion. Review the server log, then retry safely.';
      await failed.query(`UPDATE data_operation_jobs SET status = 'failed', error = $2, completed_at = NOW(), updated_at = NOW() WHERE id = $1`, [job.id, message]);
    } finally { failed.release(); }
  }
}
