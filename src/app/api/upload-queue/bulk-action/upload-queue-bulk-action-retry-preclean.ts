import type { Pool } from 'pg';

export async function preCleanRetryBlockingConditions(pool: Pool) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE upload_queue 
       SET webhook_payload = jsonb_set(
         COALESCE(webhook_payload, '{}'::jsonb), 
         '{processed_by_external_webhook}', 
         'false'::jsonb
       )
       WHERE status = 'queued' 
       AND webhook_payload->>'processed_by_external_webhook' = 'true'`
    );
    await client.query(
      `UPDATE upload_queue 
       SET completed_date = NULL, updated_at = now()
       WHERE status = 'queued' 
       AND completed_date > NOW() - INTERVAL '5 minutes'`
    );
    await client.query('COMMIT');
  } catch (preCleanError) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Keep old behavior: continue even if rollback fails.
    }
    console.warn('[BULK-ACTION] Retry pre-clean failed (continuing):', preCleanError);
  } finally {
    client.release();
  }
}

export async function maybePreCleanRetryBlockingConditions(action: string, pool: Pool) {
  if (action !== 'retry') {
    return;
  }

  try {
    await preCleanRetryBlockingConditions(pool);
  } catch (connectionError) {
    console.warn('[BULK-ACTION] Retry pre-clean connection failed (continuing):', connectionError);
  }
}
