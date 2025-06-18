
// src/lib/auditLog.ts
import pool from './db';

export async function logAudit(level: 'INFO' | 'WARN' | 'ERROR' | 'AUDIT', message: string, source: string, actingUserId: string | null = null, details: Record<string, any> | null = null) {
  try {
    const query = `
      INSERT INTO "LogEntry" (timestamp, level, message, source, "actingUserId", details)
      VALUES (NOW(), $1, $2, $3, $4, $5);
    `;
    await pool.query(query, [level, message, source, actingUserId, details ? JSON.stringify(details) : null]);
  } catch (error) {
    console.error('Failed to write to audit log:', error);
  }
}
