
// src/app/api/setup/check-db-schema/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { logAudit } from '@/lib/auditLog';

const ESSENTIAL_TABLES = ['User', 'Position', 'Candidate', 'TransitionRecord', 'LogEntry'];

export async function GET(request: NextRequest) {
  const missingTables: string[] = [];
  let allTablesExist = true;
  let connectionError = false;

  for (const tableName of ESSENTIAL_TABLES) {
    try {
      await pool.query(`SELECT COUNT(*) FROM "${tableName}";`);
    } catch (error: any) {
      if (error.code === '42P01') { 
        missingTables.push(tableName);
        allTablesExist = false;
      } else {
        console.error(`Error checking table "${tableName}":`, error);
        allTablesExist = false;
        connectionError = true; 
        break; 
      }
    }
  }

  if (connectionError) {
    await logAudit('ERROR', `DB schema check failed due to connection error.`, 'API:Setup', null);
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to the database or a critical error occurred during table checks. Please verify database connectivity and logs.' },
      { status: 500 }
    );
  }

  if (!allTablesExist) {
    await logAudit('WARN', `DB schema check found missing tables: ${missingTables.join(', ')}.`, 'API:Setup', null, { missingTables });
    return NextResponse.json(
      { status: 'partial', message: `Some essential database tables are missing. This indicates the init-db.sql script may not have run correctly during PostgreSQL initialization. Missing: ${missingTables.join(', ')}.`, missingTables },
      { status: 200 } 
    );
  }

  await logAudit('AUDIT', `DB schema check performed successfully. All essential tables exist.`, 'API:Setup', null);
  return NextResponse.json(
    { status: 'ok', message: 'All essential database tables appear to be set up correctly.' },
    { status: 200 }
  );
}

    