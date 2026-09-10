export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import type { ApiSecurityContext, ApiSecurityOptions } from '@/lib/apiSecurity';
import type { SecurityAlert, SecurityEvent } from '@/lib/securityMonitorUtils';

type SecurityStats = {
  totalEvents: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  unresolvedAlerts: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
};

type SecurityDashboardRouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

type SecurityDashboardHandler = (req: NextRequest, context: ApiSecurityContext) => Promise<NextResponse>;
type WithSecurityDashboardApiSecurity = (
  handler: SecurityDashboardHandler,
  options: ApiSecurityOptions
) => SecurityDashboardHandler;

let withApiSecurity: WithSecurityDashboardApiSecurity | undefined;
let getSecurityEvents: ((type?: string, severity?: string, limit?: number) => SecurityEvent[]) | undefined;
let getSecurityAlerts: ((acknowledged?: boolean, resolved?: boolean, limit?: number) => SecurityAlert[]) | undefined;
let getSecurityStats: (() => SecurityStats) | undefined;

function getLimitParam(value: string | null) {
  const limit = Number.parseInt(value ?? '50', 10);
  return Number.isNaN(limit) ? 50 : limit;
}

async function handler(req: NextRequest) {
  try {
    if (!getSecurityEvents || !getSecurityAlerts || !getSecurityStats) {
      const sec = await import('@/lib/securityMonitor');
      getSecurityEvents = sec.getSecurityEvents;
      getSecurityAlerts = sec.getSecurityAlerts;
      getSecurityStats = sec.getSecurityStats;
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const acknowledged = searchParams.get('acknowledged');
    const resolved = searchParams.get('resolved');
    const limit = getLimitParam(searchParams.get('limit'));

    const stats = getSecurityStats();
    const events = getSecurityEvents(type || undefined, severity || undefined, limit);
    const alerts = getSecurityAlerts(
      acknowledged ? acknowledged === 'true' : undefined,
      resolved ? resolved === 'true' : undefined,
      limit
    );

    return NextResponse.json({
      success: true,
      data: {
        stats,
        events,
        alerts,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[SECURITY DASHBOARD] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: SecurityDashboardRouteContext) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Service unavailable during build' }, { status: 503 });
  }
  if (!withApiSecurity) {
    const apiSec = await import('@/lib/apiSecurity');
    withApiSecurity = apiSec.withApiSecurity;
  }
  const secured = withApiSecurity(handler, {
    requireAuth: true,
    requirePermission: 'SYSTEM_SETTINGS_VIEW',
    logAccess: true,
  });
  return secured(req, context as unknown as ApiSecurityContext);
}
