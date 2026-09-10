export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { initializeEvaluationConfigurationFromAppKit } from '@/lib/appkit-initialize-evaluation';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  const body = await readRequestJsonResult(request);
  const environment = body.ok && body.value && typeof body.value === 'object'
    && (body.value as { environment?: unknown }).environment === 'development'
    ? 'development'
    : 'production';
  await initializeEvaluationConfigurationFromAppKit(environment);
  return NextResponse.json({ environment });
}
