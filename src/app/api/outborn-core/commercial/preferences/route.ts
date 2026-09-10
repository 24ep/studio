import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { CoreBillingPreferences } from '@/lib/outborn-core/commercial-types';
import { outbornRouteError } from '@/lib/outborn-core/route-error';
import { coreRequest, getOutbornRequestContext, organizationCorePath } from '@/lib/outborn-core/server';

export async function PATCH(request: NextRequest) {
  try {
    const context = await getOutbornRequestContext(request);
    const body = await request.json() as Partial<CoreBillingPreferences>;
    const preferences = await coreRequest<CoreBillingPreferences>(
      context,
      organizationCorePath(context, 'billing/preferences'),
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    return NextResponse.json(preferences);
  } catch (error) {
    return outbornRouteError(error);
  }
}
