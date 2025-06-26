import { getPool } from './db';
import type { SystemSettingKey, SystemSetting } from './types';

/**
 * Fetch a system setting by key from the SystemSetting table.
 * Returns the value as a string, or null if not set.
 */
export async function getSystemSetting(key: SystemSettingKey): Promise<string | null> {
  const client = await getPool().connect();
  try {
    const res = await client.query<SystemSetting>(
      'SELECT value FROM "SystemSetting" WHERE key = $1',
      [key]
    );
    return res.rows[0]?.value ?? null;
  } finally {
    client.release();
  }
} 