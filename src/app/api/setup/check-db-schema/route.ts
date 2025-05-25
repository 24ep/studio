
// src/app/api/setup/check-db-schema/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserProfile } from '@/lib/types';

const ESSENTIAL_TABLES = ['User', 'Position', 'Candidate', 'TransitionRecord', 'LogEntry'];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as UserProfile).role !== 'Admin') {
    return NextResponse.json({ message: 'Forbidden: Only Admins can perform this check.' }, { status: 403 });
  }

  const missingTables: string[] = [];
  let allTablesExist = true;
  let connectionError = false;

  for (const tableName of ESSENTIAL_TABLES) {
    try {
      // Using a simple query that would fail if the table doesn't exist.
      // COUNT(*) is efficient and doesn't require the table to have rows.
      await pool.query(`SELECT COUNT(*) FROM "${tableName}";`);
    } catch (error: any) {
      if (error.code === '42P01') { // '42P01' is undefined_table error in PostgreSQL
        missingTables.push(tableName);
        allTablesExist = false;
      } else {
        // Other errors (e.g., connection issues)
        console.error(`Error checking table "${tableName}":`, error);
        allTablesExist = false;
        connectionError = true; 
        // If one check fails due to connection, likely others will too, break early.
        break; 
      }
    }
  }

  if (connectionError) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to the database or a critical error occurred during table checks. Please verify database connectivity and logs.' },
      { status: 500 }
    );
  }

  if (!allTablesExist) {
    return NextResponse.json(
      { status: 'partial', message: `Some essential database tables are missing. This indicates the init-db.sql script may not have run correctly during PostgreSQL initialization. Missing: ${missingTables.join(', ')}.`, missingTables },
      { status: 200 } // Still a 200 OK because the API call itself succeeded, the payload indicates the problem
    );
  }

  return NextResponse.json(
    { status: 'ok', message: 'All essential database tables appear to be set up correctly.' },
    { status: 200 }
  );
}
