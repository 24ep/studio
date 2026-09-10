import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type {
  CoreBillingPreferences,
  CoreBillingSnapshot,
  CoreEntitlement,
  CoreUsageMetric,
  HriveCommercialOverview,
} from '@/lib/outborn-core/commercial-types';
import { outbornRouteError } from '@/lib/outborn-core/route-error';
import {
  coreRequest,
  getOutbornRequestContext,
  organizationCorePath,
  OutbornServiceError,
} from '@/lib/outborn-core/server';

async function billingSnapshot(context: Awaited<ReturnType<typeof getOutbornRequestContext>>) {
  try {
    return await coreRequest<CoreBillingSnapshot>(context, organizationCorePath(context, 'billing'));
  } catch (error) {
    if (error instanceof OutbornServiceError && error.status === 404) return null;
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await getOutbornRequestContext(request);
    const selectedOrganization = context.identity.organizations.find(org => org.id === context.organizationId)!;
    const [billing, preferences, allEntitlements, allUsage] = await Promise.all([
      billingSnapshot(context),
      coreRequest<CoreBillingPreferences>(context, organizationCorePath(context, 'billing/preferences')),
      coreRequest<CoreEntitlement[]>(context, organizationCorePath(context, 'entitlements')),
      coreRequest<CoreUsageMetric[]>(context, organizationCorePath(context, 'usage')),
    ]);
    const overview: HriveCommercialOverview = {
      organizationId: context.organizationId,
      organizationName: selectedOrganization.name,
      organizationRole: selectedOrganization.role,
      billing,
      preferences,
      entitlements: allEntitlements.filter(item => item.key.startsWith('hrive.')),
      usage: allUsage.filter(item => item.key.startsWith('hrive.')),
    };
    return NextResponse.json(overview);
  } catch (error) {
    return outbornRouteError(error);
  }
}
