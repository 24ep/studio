import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { fetchDashboardMetrics } from '@/lib/dashboard-metrics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const canViewAll = hasPermission(session.user, 'applicantS_VIEW');
    
    const pool = getPool();
    const client = await pool.connect();

    try {
      const metrics = await fetchDashboardMetrics(client, userId, canViewAll);
      return NextResponse.json(metrics);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DASHBOARD METRICS API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

