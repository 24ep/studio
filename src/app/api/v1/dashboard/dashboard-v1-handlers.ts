import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import { SimpleErrorHandler, createInternalServerError } from '@/lib/errors';
import { requireDashboardV1Auth } from './dashboard-v1-auth';
import { fetchDashboardV1Data } from './dashboard-v1-data';
import { serializeDashboardV1Data } from './dashboard-v1-response';

export async function handleGetDashboardV1(request: NextRequest) {
  try {
    const authError = await requireDashboardV1Auth(request);
    if (authError) {
      return authError;
    }

    const dashboardData = serializeDashboardV1Data(await fetchDashboardV1Data());
    return SimpleErrorHandler.createSuccessResponse(request, dashboardData, 200);
  } catch {
    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError('Failed to fetch dashboard data'),
    );
  }
}

export function handleDashboardV1Options(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
