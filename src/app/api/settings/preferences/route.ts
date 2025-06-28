/**
 * @openapi
 * /api/settings/preferences:
 *   get:
 *     summary: Get user preferences
 *     description: Returns the current user's UI display preferences. Requires authentication.
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   candidateAttributes:
 *                     name: { uiPreference: "Standard", customNote: "" }
 *                   positionAttributes:
 *                     title: { uiPreference: "Standard", customNote: "" }
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Update user UI preferences (attributes)
 *     description: Updates the UI preferences for candidate and position attributes for the current user. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidateAttributes:
 *                 type: object
 *                 additionalProperties:
 *                   type: object
 *                   properties:
 *                     uiPreference:
 *                       type: string
 *                     customNote:
 *                       type: string
 *               positionAttributes:
 *                 type: object
 *                 additionalProperties:
 *                   type: object
 *                   properties:
 *                     uiPreference:
 *                       type: string
 *                     customNote:
 *                       type: string
 *     responses:
 *       200:
 *         description: Preferences updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import type { UserDataModelPreference, UIDisplayPreference, DataModelPreferences } from '@/lib/types';

const UI_DISPLAY_PREFERENCES_SERVER: [UIDisplayPreference, ...UIDisplayPreference[]] = ["Standard", "Emphasized", "Hidden"];

const attributePreferenceSchema = z.object({
  uiPreference: z.enum(UI_DISPLAY_PREFERENCES_SERVER),
  customNote: z.string().nullable().optional(),
});

const preferencesSchema = z.object({
  candidateAttributes: z.record(attributePreferenceSchema),
  positionAttributes: z.record(attributePreferenceSchema),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized: No active session" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const result = await getPool().query(
      'SELECT model_type AS "modelType", attribute_key AS "attributeKey", ui_preference AS "uiPreference", custom_note AS "customNote" FROM "UserUIDisplayPreference" WHERE "userId" = $1',
      [userId]
    );
    const prefs: DataModelPreferences = {
      candidateAttributes: {},
      positionAttributes: {},
    };
    for (const row of result.rows) {
      if (row.modelType === 'Candidate') {
        prefs.candidateAttributes[row.attributeKey] = {
          uiPreference: row.uiPreference,
          customNote: row.customNote ?? '',
        };
      } else if (row.modelType === 'Position') {
        prefs.positionAttributes[row.attributeKey] = {
          uiPreference: row.uiPreference,
          customNote: row.customNote ?? '',
        };
      }
    }
    return NextResponse.json(prefs, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch user UI preferences:", error);
    await logAudit('ERROR', `Failed to fetch UI preferences for user ${userId}. Error: ${(error as Error).message}`, 'API:Preferences:Get', userId);
    return NextResponse.json({ message: "Error fetching user UI preferences", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized: No active session" }, { status: 401 });
  }
  const userId = session.user.id;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = preferencesSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for user UI preferences", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { candidateAttributes, positionAttributes } = validationResult.data;
  const preferencesToSave: Omit<UserDataModelPreference, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  for (const [attributeKey, value] of Object.entries(candidateAttributes)) {
    preferencesToSave.push({
      userId,
      modelType: 'Candidate',
      attributeKey,
      uiPreference: value.uiPreference,
      customNote: value.customNote ?? '',
    });
  }
  for (const [attributeKey, value] of Object.entries(positionAttributes)) {
    preferencesToSave.push({
      userId,
      modelType: 'Position',
      attributeKey,
      uiPreference: value.uiPreference,
      customNote: value.customNote ?? '',
    });
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    // Upsert each preference
    for (const pref of preferencesToSave) {
      await client.query(
        `INSERT INTO "UserUIDisplayPreference" ("userId", model_type, attribute_key, ui_preference, custom_note, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT ("userId", model_type, attribute_key) DO UPDATE SET
           ui_preference = EXCLUDED.ui_preference,
           custom_note = EXCLUDED.custom_note,
           "updatedAt" = NOW()`,
        [userId, pref.modelType, pref.attributeKey, pref.uiPreference, pref.customNote]
      );
    }
    await client.query('COMMIT');
    await logAudit('AUDIT', `User UI preferences updated by ${session.user.name}. ${preferencesToSave.length} preferences processed.`, 'API:Preferences:Update', userId, { count: preferencesToSave.length });
    return NextResponse.json({ message: "Preferences updated" }, { status: 200 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to save user UI preferences:", error);
    await logAudit('ERROR', `Failed to save UI preferences for user ${userId} by ${session.user.name}. Error: ${error.message}`, 'API:Preferences:Update', userId);
    return NextResponse.json({ message: "Error saving user UI preferences", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
} 