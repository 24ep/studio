export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { auth } from '@/auth';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

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
    await logAudit('ERROR', `Failed to fetch preferences for user ${userId}. Error: ${errorMessage}`, 'API:Preferences:Get', userId);
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
    await logAudit('AUDIT', `User preferences update attempted by ${session.user.name} (data model functionality removed)`, 'API:Preferences:Update', userId);
    return NextResponse.json({ message: "Preferences updated" }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error("Failed to save user preferences:", error);
    await logAudit('ERROR', `Failed to save preferences for user ${userId} by ${session.user.name}. Error: ${errorMessage}`, 'API:Preferences:Update', userId);
    return NextResponse.json({ message: "Error saving user preferences", error: errorMessage }, { status: 500 });
  }
} 
