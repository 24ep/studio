export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getPool } from '@/lib/db';

import { auth } from '@/auth';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view positions
    if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view positions' }, { status: 403 });
    }

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        message: "Database configuration error", 
        error: "DATABASE_URL environment variable is not set" 
      }, { status: 500 });
    }

    const pool = getPool();
    
    // Simple query to test database connection
    const result = await pool.query('SELECT COUNT(*) as count FROM "Position"');
    
    return NextResponse.json({ 
      message: "Simple positions API working",
      positionCount: result.rows[0].count
      // SECURITY: Removed databaseUrl status to prevent information disclosure
    });
    
  } catch (error) {
    console.error('Simple positions API error:', error);
    // SECURITY: Never expose stack traces in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json({ 
      message: "An error occurred while processing your request",
      error: isDevelopment ? (error as Error).message : "Internal server error",
      ...(isDevelopment && { stack: (error as Error).stack })
    }, { status: 500 });
  }
} 
