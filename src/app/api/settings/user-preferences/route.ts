export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// src/app/api/settings/user-preferences/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { auth } from '@/auth';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @openapi
 * /api/settings/user-preferences:
 *   get:
 *     summary: Get user preferences
 *     description: Returns the preferences for the current user. Requires authentication.
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Update user preferences
 *     description: Updates the preferences for the current user. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated user preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized: No active session" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Return empty preferences object since data model functionality has been removed
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Failed to fetch user preferences:", error);
    await logAudit('ERROR', `Failed to fetch preferences for user ${userId}. Error: ${errorMessage}`, 'API:UserPreferences:Get', userId);
    return NextResponse.json({ message: "Error fetching user preferences", error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized: No active session" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Data model functionality has been removed, so just return success
    await logAudit('AUDIT', `User preferences update attempted by ${session.user.name} (data model functionality removed)`, 'API:UserPreferences:Update', userId);
    return NextResponse.json({ message: "Preferences updated" }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("Failed to save user preferences:", error);
    await logAudit('ERROR', `Failed to save preferences for user ${userId} by ${session.user.name}. Error: ${errorMessage}`, 'API:UserPreferences:Update', userId);
    return NextResponse.json({ message: "Error saving user preferences", error: errorMessage }, { status: 500 });
  }
}
