export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
import type { ApiSecurityContext, ApiSecurityOptions } from '@/lib/apiSecurity';

type SecurityAlertRouteContext = {
  params: Promise<{ alertId: string }>;
};

type SecurityAlertAction = 'acknowledge' | 'resolve';
type SecurityAlertActionHandler = (alertId: string, userId: string) => Promise<boolean>;
type SecurityAlertHandler = (req: NextRequest, context: SecurityAlertRouteContext) => Promise<NextResponse>;
type WithSecurityAlertApiSecurity = (
  handler: SecurityAlertHandler,
  options: ApiSecurityOptions
) => SecurityAlertHandler;
type PermissionSessionResult = {
  session?: {
    user?: {
      id?: string;
    };
  };
  error?: NextResponse;
};
type RequireSessionAndPermission = (
  requiredPermission: string,
  request: NextRequest
) => Promise<PermissionSessionResult>;

let withApiSecurity: WithSecurityAlertApiSecurity | undefined;
let acknowledgeSecurityAlert: SecurityAlertActionHandler | undefined;
let resolveSecurityAlert: SecurityAlertActionHandler | undefined;
let requireSessionAndPermission: RequireSessionAndPermission | undefined;

function isSecurityAlertAction(action: unknown): action is SecurityAlertAction {
  return action === 'acknowledge' || action === 'resolve';
}

async function handler(
  req: NextRequest,
  { params }: SecurityAlertRouteContext
) {
  try {
    if (!acknowledgeSecurityAlert || !resolveSecurityAlert || !requireSessionAndPermission) {
      const sec = await import('@/lib/securityMonitor');
      acknowledgeSecurityAlert = sec.acknowledgeSecurityAlert;
      resolveSecurityAlert = sec.resolveSecurityAlert;
      const authMod = await import('@/lib/auth');
      requireSessionAndPermission = authMod.requireSessionAndPermission;
    }
    const { alertId } = await params;
    const body = await readRequestJsonObject(req);
    const action = getJsonString(body, 'action');

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Get user session for logging
    const sessionResult = await requireSessionAndPermission('SYSTEM_SETTINGS_EDIT', req);
    if (sessionResult.error) {
      return sessionResult.error;
    }

    const userId = sessionResult.session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSecurityAlertAction(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "acknowledge" or "resolve"' },
        { status: 400 }
      );
    }

    let success = false;
    let message = '';

    switch (action) {
      case 'acknowledge':
        success = await acknowledgeSecurityAlert(alertId, userId);
        message = success ? 'Alert acknowledged' : 'Failed to acknowledge alert';
        break;
      case 'resolve':
        success = await resolveSecurityAlert(alertId, userId);
        message = success ? 'Alert resolved' : 'Failed to resolve alert';
        break;
    }

    if (!success) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
      alertId,
      action,
    });
  } catch (error) {
    console.error('[SECURITY ALERT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: SecurityAlertRouteContext) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Service unavailable during build' }, { status: 503 });
  }
  if (!withApiSecurity) {
    const apiSec = await import('@/lib/apiSecurity');
    withApiSecurity = (routeHandler, options) => {
      const securedHandler = apiSec.withApiSecurity(
        (request, apiContext) => routeHandler(request, apiContext as SecurityAlertRouteContext),
        options
      );
      return (request, routeContext) => securedHandler(request, routeContext as unknown as ApiSecurityContext);
    };
  }
  const secured = withApiSecurity(handler, {
    requireAuth: true,
    requirePermission: 'SYSTEM_SETTINGS_EDIT',
    logAccess: true,
  });
  return secured(req, context);
}

// Provide a minimal GET to prevent build-time route probing from triggering heavy logic
export async function GET() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
