
// src/app/api/settings/system-settings/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { SystemSetting } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const systemSettingSchema = z.object({
  key: z.enum(['appName', 'appLogoDataUrl', 'appThemePreference']),
  value: z.string().nullable(), // Allow null for resetting logo
});

const saveSystemSettingsSchema = z.array(systemSettingSchema);

export async function GET(request: NextRequest) {
  // Publicly accessible or light auth check if needed for non-sensitive parts
  try {
    const result = await pool.query('SELECT key, value, "updatedAt" FROM "SystemSetting"');
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    return NextResponse.json({ message: "Error fetching system settings", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('SYSTEM_SETTINGS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to update system settings by user ${session?.user?.email || 'Unknown'}.`, 'API:SystemSettings:Update', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = saveSystemSettingsSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for system settings", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const settingsToSave = validationResult.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const savedSettings: SystemSetting[] = [];

    for (const setting of settingsToSave) {
      const upsertQuery = `
        INSERT INTO "SystemSetting" (key, value, "updatedAt")
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          "updatedAt" = NOW()
        RETURNING key, value, "updatedAt";
      `;
      const result = await client.query(upsertQuery, [setting.key, setting.value]);
      savedSettings.push(result.rows[0]);
    }

    await client.query('COMMIT');
    await logAudit('AUDIT', `System settings updated by ${session.user.name}. Keys: ${settingsToSave.map(s=>s.key).join(', ')}`, 'API:SystemSettings:Update', session.user.id, { updatedKeys: settingsToSave.map(s=>s.key) });
    
    // Return all current settings after update
    const allSettingsResult = await client.query('SELECT key, value, "updatedAt" FROM "SystemSetting"');
    return NextResponse.json(allSettingsResult.rows, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to save system settings:", error);
    await logAudit('ERROR', `Failed to save system settings by ${session.user.name}. Error: ${error.message}`, 'API:SystemSettings:Update', session.user.id);
    return NextResponse.json({ message: "Error saving system settings", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
