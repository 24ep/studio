import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { PlatformModuleId } from '@/lib/types';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';

export async function requireApiSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  return { response: null, session };
}

export async function requireApiPermission(permission: PlatformModuleId) {
  const { response, session } = await requireApiSession();

  if (response) {
    return { response, session: null };
  }

  if (!hasPermission(session.user, permission)) {
    return {
      response: NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      ),
      session,
    };
  }

  return { response: null, session };
}

export async function requireAnyApiPermission(permissions: PlatformModuleId[]) {
  const { response, session } = await requireApiSession();

  if (response) {
    return { response, session: null };
  }

  if (!hasAnyPermission(session.user, permissions)) {
    return {
      response: NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      ),
      session,
    };
  }

  return { response: null, session };
}

export function requireAutomationApiKey(request: NextRequest) {
  const configuredKey = process.env.AUTOMATION_API_KEY || process.env.PROCESSOR_API_KEY;

  if (!configuredKey) {
    return NextResponse.json(
      { error: 'Automation API key is not configured' },
      { status: 503 }
    );
  }

  const authorization = request.headers.get('authorization') || '';
  const bearerToken = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';
  const suppliedKey = request.headers.get('x-api-key') || bearerToken;

  if (suppliedKey !== configuredKey) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid automation API key required' },
      { status: 401 }
    );
  }

  return null;
}
