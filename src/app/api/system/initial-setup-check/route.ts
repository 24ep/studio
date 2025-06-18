
// src/app/api/system/initial-setup-check/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const client = await pool.connect();
  try {
    // List of essential tables to check
    const essentialTables = [
        'User', 'Position', 'Candidate', 'LogEntry', 'RecruitmentStage', 'TransitionRecord',
        'UserGroup', 'User_UserGroup', 'UserGroup_PlatformModule', 
        'CustomFieldDefinition', 'SystemSetting', 'UserUIDisplayPreference',
        'WebhookFieldMapping', 'NotificationEvent', 'NotificationChannel', 'NotificationSetting',
        'ResumeHistory' // Added ResumeHistory
    ];
    let allTablesExist = true;
    const missingTables: string[] = [];

    for (const tableName of essentialTables) {
      const res = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name = $1
         );`,
        [tableName]
      );
      if (!res.rows[0]?.exists) {
        allTablesExist = false;
        missingTables.push(tableName);
      }
    }

    if (allTablesExist) {
      return NextResponse.json({ schemaInitialized: true, message: "Essential tables found." });
    } else {
      return NextResponse.json({ 
        schemaInitialized: false, 
        message: "One or more essential database tables are missing. The application may not function correctly.",
        missingTables: missingTables 
      }, { status: 200 }); // Still 200, but with schemaInitialized: false
    }
  } catch (error) {
    console.error("Error during initial setup check (database):", error);
    // Attempt to give a more specific error if it's about a relation not existing, which might indicate a fundamental DB issue.
    if (error instanceof Error && (error as any).code === '42P01') { // PostgreSQL error code for undefined_table
         return NextResponse.json({ 
            schemaInitialized: false,
            message: `Database error: A required table might be missing or not accessible. Details: ${(error as Error).message}`,
            error: (error as Error).message,
            code: (error as any).code
        }, { status: 200 });
    }
    return NextResponse.json({ 
      schemaInitialized: false, // Assume false on generic error
      message: "Error checking database schema. This could be due to a connection issue or misconfiguration.", 
      error: (error as Error).message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}
