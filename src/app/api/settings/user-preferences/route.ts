// src/app/api/settings/user-preferences/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import type { UserDataModelPreference, UIDisplayPreference } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';

export const dynamic = "force-dynamic";

const UI_DISPLAY_PREFERENCES_SERVER: [UIDisplayPreference, ...UIDisplayPreference[]] = ["Standard", "Emphasized", "Hidden"];

const userPreferenceSchema = z.object({
  // userId is taken from session
  modelType: z.enum(['Candidate', 'Position']),
  attributeKey: z.string().min(1),
  uiPreference: z.enum(UI_DISPLAY_PREFERENCES_SERVER),
  customNote: z.string().nullable().optional(),
});

const saveUserPreferencesSchema = z.array(userPreferenceSchema);

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized: No active session" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const result = await getPool().query(
      'SELECT id, "userId", model_type AS "modelType", attribute_key AS "attributeKey", ui_preference AS "uiPreference", custom_note AS "customNote", "createdAt", "updatedAt" FROM "UserUIDisplayPreference" WHERE "userId" = $1',
      [userId]
    );
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch user UI preferences:", error);
    await logAudit('ERROR', `Failed to fetch UI preferences for user ${userId}. Error: ${(error as Error).message}`, 'API:UserPreferences:Get', userId);
    return NextResponse.json({ message: "Error fetching user UI preferences", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized: No active session" }, { status: 401 });
  }
  // Optional: Add permission check if needed, though users typically manage their own prefs.
  // if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('USER_PREFERENCES_MANAGE')) { ... }

  const userId = session.user.id;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = saveUserPreferencesSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for user UI preferences", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const preferencesToSave = validationResult.data;
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    
    // Option 1: Delete all existing preferences for this user and re-insert. Simpler.
    // await client.query('DELETE FROM "UserUIDisplayPreference" WHERE "userId" = $1', [userId]);
    // for (const pref of preferencesToSave) { ... insert ... }
    
    // Option 2: Upsert each preference. More robust if partial updates are ever needed.
    const savedPrefs: UserDataModelPreference[] = [];
    for (const pref of preferencesToSave) {
      const upsertQuery = `
        INSERT INTO "UserUIDisplayPreference" ("userId", model_type, attribute_key, ui_preference, custom_note, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT ("userId", model_type, attribute_key) DO UPDATE SET
          ui_preference = EXCLUDED.ui_preference,
          custom_note = EXCLUDED.custom_note,
          "updatedAt" = NOW()
        RETURNING id, "userId", model_type AS "modelType", attribute_key AS "attributeKey", ui_preference AS "uiPreference", custom_note AS "customNote", "createdAt", "updatedAt";
      `;
      const result = await client.query(upsertQuery, [
        userId,
        pref.modelType,
        pref.attributeKey,
        pref.uiPreference,
        pref.customNote
      ]);
      savedPrefs.push(result.rows[0]);
    }

    await client.query('COMMIT');
    await logAudit('AUDIT', `User UI preferences updated by ${session.user.name}. ${preferencesToSave.length} preferences processed.`, 'API:UserPreferences:Update', userId, { count: preferencesToSave.length });
    
    return NextResponse.json(savedPrefs, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to save user UI preferences:", error);
    await logAudit('ERROR', `Failed to save UI preferences for user ${userId} by ${session.user.name}. Error: ${error.message}`, 'API:UserPreferences:Update', userId);
    return NextResponse.json({ message: "Error saving user UI preferences", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
