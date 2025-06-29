import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// TODO: Create SystemPreference table if it does not exist yet
// CREATE TABLE "SystemPreference" (
//   key VARCHAR PRIMARY KEY,
//   value VARCHAR,
//   updatedAt TIMESTAMP DEFAULT NOW()
// );

const preferenceSchema = z.object({
  themePreference: z.enum(["light", "dark", "system"]),
  appName: z.string(),
  appLogoDataUrl: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const result = await getPool().query('SELECT key, value FROM "SystemPreference"');
    const prefs = Object.fromEntries(result.rows.map(row => [row.key, row.value]));
    return NextResponse.json(prefs, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch system preferences:", error);
    return NextResponse.json({ message: "Error fetching system preferences", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('SYSTEM_SETTINGS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to update system preferences by user ${session?.user?.email || 'Unknown'}.`, 'API:SystemPreferences:Update', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = preferenceSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for system preferences", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const prefsToSave = validationResult.data;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(prefsToSave)) {
      await client.query(
        `INSERT INTO "SystemPreference" (key, value, "updatedAt")
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
        [key, value]
      );
    }
    await client.query('COMMIT');
    await logAudit('AUDIT', `System preferences updated by ${session.user.name}. Keys: ${Object.keys(prefsToSave).join(', ')}`, 'API:SystemPreferences:Update', session.user.id, { updatedKeys: Object.keys(prefsToSave) });
    return NextResponse.json({ message: "System preferences updated" }, { status: 200 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to save system preferences:", error);
    await logAudit('ERROR', `Failed to save system preferences by ${session.user.name}. Error: ${error.message}`, 'API:SystemPreferences:Update', session.user.id);
    return NextResponse.json({ message: "Error saving system preferences", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
} 