export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Public endpoint: coarse liveness probe only. Detailed checks are permission-gated.
export async function GET() {
  try {
    // Test database connection
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    const uptime = process.uptime();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: uptime,
      version: process.env.npm_package_version || 'unknown',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
    }, { status: 503 });
  }
} 
