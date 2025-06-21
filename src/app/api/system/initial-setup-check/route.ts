// src/app/api/system/initial-setup-check/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const client = await pool.connect();
  try {
    const essentialTables = [
        'User', 'Position', 'Candidate', 'LogEntry', 'RecruitmentStage', 'TransitionRecord',
        'UserGroup', 'User_UserGroup', 'UserGroup_PlatformModule',
        'CustomFieldDefinition', 'SystemSetting', 'UserUIDisplayPreference',
        'WebhookFieldMapping', 'NotificationEvent', 'NotificationChannel', 'NotificationSetting',
        'ResumeHistory'
    ];

    // Single query to check for all tables
    const queryText = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1::text[]);
    `;
    const result = await client.query(queryText, [essentialTables]);
    const foundTables = result.rows.map(row => row.table_name);

    const missingTables = essentialTables.filter(tableName => !foundTables.includes(tableName));

    if (missingTables.length === 0) {
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
    if (error instanceof Error && (error as any).code === '42P01') { // PostgreSQL error code for undefined_table
         return NextResponse.json({
            schemaInitialized: false,
            message: `Database error: A required table might be missing or not accessible. Details: ${(error as Error).message}`,
            error: (error as Error).message,
            code: (error as any).code
        }, { status: 200 }); // Important to return 200 for the client to parse schemaInitialized
    }
    // For other errors, returning 500 is more appropriate if the check itself fails fundamentally.
    // The client SetupFlowHandler will interpret a non-200 or failed fetch as a setup issue and redirect.
    return NextResponse.json({
      schemaInitialized: false,
      message: "Error checking database schema. This could be due to a connection issue or misconfiguration.",
      error: (error as Error).message
    }, { status: 500 });
  } finally {
    client.release();
  }
}
