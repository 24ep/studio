// src/lib/auditLog.ts
import { getPool } from './db';
/**
 * Writes an audit log entry to the database.
 */
export async function logAudit(level, message, source, actingUserId = null, details = null) {
    const client = await getPool().connect();
    try {
        const query = `
      INSERT INTO "AuditLog" (level, message, source, "actingUserId", details, timestamp)
      VALUES ($1, $2, $3, $4, $5, NOW());
    `;
        await client.query(query, [level, message, source, actingUserId, details]);
    }
    catch (error) {
        // If the audit log itself fails, we log to the console as a fallback.
        // This is critical to ensure logging failures don't crash the application.
        console.error('CRITICAL: Failed to write to audit log table:', error);
        console.error('Fallback Log:', { level, message, source, actingUserId, details });
    }
    finally {
        client.release();
    }
}
export async function logAuditEvent(userId, action, entity, entityId, details = null) {
    const client = await getPool().connect();
    try {
        const query = `
      INSERT INTO "AuditLog" (user_id, action, entity, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `;
        await client.query(query, [userId, action, entity, entityId, details]);
    }
    finally {
        client.release();
    }
}
