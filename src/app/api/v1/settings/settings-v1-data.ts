import { getPool } from '@/lib/db';
import type { SettingsV1DataRows } from './settings-v1-types';

export async function fetchV1SettingsData(userId: string): Promise<SettingsV1DataRows> {
  const client = await getPool().connect();

  try {
    const systemSettingsResult = await client.query(`
      SELECT
        key,
        value,
        category
      FROM "SystemSetting"
      ORDER BY category, key
    `);

    const customFieldsResult = await client.query(`
      SELECT
        id,
        name,
        type,
        is_required as "isRequired",
        options,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM "CustomFieldDefinition"
      ORDER BY name
    `);

    const userPreferencesResult = await client.query(`
      SELECT
        key,
        value
      FROM "UserPreference"
      WHERE user_id = $1
      ORDER BY key
    `, [userId]);

    return {
      systemSettings: systemSettingsResult.rows,
      userPreferences: userPreferencesResult.rows,
      customFields: customFieldsResult.rows,
    };
  } finally {
    client.release();
  }
}
