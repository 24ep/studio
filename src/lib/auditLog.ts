
// src/lib/auditLog.ts
'use server';

import type { LogLevel } from './types';

/**
 * Logs an audit event to the /api/logs endpoint.
 * This function is intended to be called from server-side API routes or NextAuth event handlers.
 *
 * @param level The log level, typically 'AUDIT'.
 * @param message The audit log message.
 * @param source A string indicating the source of the log (e.g., 'API:Users', 'Auth').
 * @param actingUserId The ID of the user performing the action (optional).
 * @param details Additional structured data relevant to the audit event (optional).
 */
export async function logAudit(
  level: LogLevel,
  message: string,
  source: string,
  actingUserId?: string | null,
  details?: Record<string, any> | null
): Promise<void> {
  // Ensure NEXTAUTH_URL is set in your environment for server-side fetch
  const logsApiUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:9002'}/api/logs`;

  try {
    const response = await fetch(logsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        source,
        actingUserId: actingUserId || null, // Ensure null if undefined
        details: details || null,       // Ensure null if undefined
      }),
    });

    if (!response.ok) {
      // Attempt to get more details from the response if possible
      const errorBody = await response.text().catch(() => 'Could not parse error response body.');
      console.error(
        `Failed to write audit log. Status: ${response.status}. URL: ${logsApiUrl}. Response: ${errorBody}. Original Log:`,
        { level, message, source, actingUserId, details }
      );
    }
  } catch (error) {
    console.error('Error sending audit log:', error, 'Original Log:', { level, message, source, actingUserId, details });
  }
}
