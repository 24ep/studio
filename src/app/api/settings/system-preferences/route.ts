import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { getPool, type DbClient } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import { preferenceSchema } from './system-preferences-schema';
import { fetchSystemPreferences, saveSystemPreferences } from './system-preferences-store';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: NextRequest) {
  void request;

  try {
    return NextResponse.json(await fetchSystemPreferences(), { status: 200 });
  } catch (error) {
    console.error("Failed to fetch system preferences:", error);
    return NextResponse.json({ message: "Error fetching system preferences", error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    await logAudit('WARN', `Forbidden attempt to update system preferences by user ${session?.user?.email || 'Unknown'}.`, 'API:SystemPreferences:Update', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: "Error parsing request body", error: getErrorMessage(bodyResult.error) }, { status: 400 });
  }

  const body = bodyResult.value;
  const validationResult = preferenceSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for system preferences", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const prefsToSave = validationResult.data;
  const client: DbClient = await getPool().connect();
  try {
    await client.query('BEGIN');
    await saveSystemPreferences(client, prefsToSave);
    await client.query('COMMIT');
    await logAudit('AUDIT', `System preferences updated by ${session.user.name}. Keys: ${Object.keys(prefsToSave).join(', ')}`, 'API:SystemPreferences:Update', session.user.id, { updatedKeys: Object.keys(prefsToSave) });
    return NextResponse.json({ message: "System preferences updated" }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    await client.query('ROLLBACK');
    console.error("Failed to save system preferences:", error);
    await logAudit('ERROR', `Failed to save system preferences by ${session.user?.name || session?.user?.email || 'Unknown'}. Error: ${errorMessage}`, 'API:SystemPreferences:Update', session?.user?.id);
    return NextResponse.json({ message: "Error saving system preferences", error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
} 
