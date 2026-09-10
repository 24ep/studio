import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import { SimpleErrorHandler, createInternalServerError } from '@/lib/errors';
import { requireV1LogsViewPermission } from './logs-v1-auth';
import { fetchV1Logs } from './logs-v1-data';
import { parseV1LogsQuery } from './logs-v1-query';

export async function handleGetV1Logs(request: NextRequest) {
  try {
    const permissionError = await requireV1LogsViewPermission(request);
    if (permissionError) {
      return permissionError;
    }

    const response = await fetchV1Logs(parseV1LogsQuery(request));
    return SimpleErrorHandler.createSuccessResponse(request, response, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError(`Failed to fetch logs: ${errorMessage}`),
    );
  }
}

export function handleV1LogsOptions(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
