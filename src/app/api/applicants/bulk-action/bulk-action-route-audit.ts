import { v4 as uuidv4 } from 'uuid';

import type { QueryableClient } from './bulk-action-route-client-types';

export async function logAuditWithClient(
  client: QueryableClient,
  level: string,
  message: string,
  source: string,
  actingUserId: string | null,
  details: unknown = null
) {
  try {
    let sanitizedActingUserId: string | null = actingUserId;
    if (sanitizedActingUserId) {
      try {
        const check = await client.query('SELECT 1 FROM "User" WHERE id = $1 LIMIT 1', [sanitizedActingUserId]);
        if (check.rowCount === 0) {
          sanitizedActingUserId = null;
        }
      } catch {
        sanitizedActingUserId = null;
      }
    }

    await client.query(
      `
        INSERT INTO "LogEntry" (id, timestamp, level, message, source, "actingUserId", details, "createdAt")
        VALUES ($1, NOW(), $2, $3, $4, $5, $6, NOW());
      `,
      [uuidv4(), level, message, source, sanitizedActingUserId, details]
    );
  } catch (error) {
    console.error('CRITICAL: Failed to write to LogEntry table:', error);
    console.error('Fallback Log:', { level, message, source, actingUserId, details });
  }
}
