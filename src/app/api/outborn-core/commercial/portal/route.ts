import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { outbornRouteError } from '@/lib/outborn-core/route-error';
import { coreRequest, getOutbornRequestContext, organizationCorePath } from '@/lib/outborn-core/server';

export async function POST(request: NextRequest) {
  try {
    const context = await getOutbornRequestContext(request);
    const portal = await coreRequest<{ url: string }>(
      context,
      organizationCorePath(context, 'billing/portal-session'),
      { method: 'POST' },
    );
    return NextResponse.json(portal);
  } catch (error) {
    return outbornRouteError(error);
  }
}
