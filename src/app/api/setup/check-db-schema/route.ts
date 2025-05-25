
// src/app/api/setup/check-db-schema/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserProfile } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const ESSENTIAL_TABLES = ['User', 'Position', 'Candidate', 'TransitionRecord', 'LogEntry'];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as UserProfile).role !== 'Admin') {
    await logAudit('WARN', `Forbidden attempt to check DB schema by ${session?.user?.name || 'Unauthenticated User'} (ID: ${session?.user?.id}). Required role: Admin.`, 'API:Setup', session?.user?.id);
    return NextResponse.json({ message: 'Forbidden: Only Admins can perform this check.' }, { status: 403 });
  }

  const missingTables: string[] = [];
  let allTablesExist = true;
  let connectionError = false;

  for (const tableName of ESSENTIAL_TABLES) {
    try {
      await pool.query(`SELECT COUNT(*) FROM "${tableName}";`);
    } catch (error: any) {
      if (error.code === '42P01') { // '42P01' is undefined_table error in PostgreSQL
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
    await logAudit('ERROR', `DB schema check failed due to connection error. Performed by ${session.user.name} (ID: ${session.user.id}).`, 'API:Setup', session.user.id);
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to the database or a critical error occurred during table checks. Please verify database connectivity and logs.' },
      { status: 500 }
    );
  }

  if (!allTablesExist) {
    await logAudit('WARN', `DB schema check found missing tables: ${missingTables.join(', ')}. Performed by ${session.user.name} (ID: ${session.user.id}).`, 'API:Setup', session.user.id, { missingTables });
    return NextResponse.json(
      { status: 'partial', message: `Some essential database tables are missing. This indicates the init-db.sql script may not have run correctly during PostgreSQL initialization. Missing: ${missingTables.join(', ')}.`, missingTables },
      { status: 200 } 
    );
  }

  await logAudit('AUDIT', `DB schema check performed successfully by ${session.user.name} (ID: ${session.user.id}). All essential tables exist.`, 'API:Setup', session.user.id);
  return NextResponse.json(
    { status: 'ok', message: 'All essential database tables appear to be set up correctly.' },
    { status: 200 }
  );
}
