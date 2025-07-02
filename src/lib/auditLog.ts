// src/lib/auditLog.ts
import { getPool } from './db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Writes an audit log entry to the database.
 */
export async function logAudit(
  level: 'INFO' | 'WARN' | 'ERROR' | 'AUDIT',
  message: string,
  source: string,
  actingUserId: string | null = null,
  details: Record<string, any> | null = null
) {
  const client = await getPool().connect();
  try {
    const query = `
      INSERT INTO "AuditLog" (id, level, message, source, "actingUserId", details, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, NOW());
    `;
    await client.query(query, [uuidv4(), level, message, source, actingUserId, details]);
  } catch (error) {
    // If the audit log itself fails, we log to the console as a fallback.
    // This is critical to ensure logging failures don't crash the application.
    console.error('CRITICAL: Failed to write to audit log table:', error);
    console.error('Fallback Log:', { level, message, source, actingUserId, details });
  } finally {
    client.release();
  }
}

export async function logAuditEvent(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, any> | null = null
) {
  const client = await getPool().connect();
  try {
    const query = `
      INSERT INTO "AuditLog" (user_id, action, entity, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await client.query(query, [userId, action, entity, entityId, details]);
  } finally {
    client.release();
  }
}