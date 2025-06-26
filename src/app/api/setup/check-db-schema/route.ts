import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

/**
 * GET /api/setup/check-db-schema
 * Checks if the 'User' table exists in the database.
 * Returns { status: 'ok' } if it exists, otherwise { status: 'missing_tables', details: ... }
 */
export async function GET() {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT to_regclass('"User"') as user_table;
    `);
    const userTableExists = result.rows[0]?.user_table !== null;
    if (userTableExists) {
      return NextResponse.json({ status: 'ok' });
    } else {
      return NextResponse.json({ status: 'missing_tables', details: { missing: ['User'] } }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
} 