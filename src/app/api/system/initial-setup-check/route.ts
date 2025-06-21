// src/app/api/system/initial-setup-check/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // A simple query to check if a core table like 'User' exists.
    // This is a proxy for checking if the schema has been initialized.
    await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;

    return NextResponse.json({
      schemaInitialized: true,
      message: "Database schema is initialized."
    });
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
  }
}
