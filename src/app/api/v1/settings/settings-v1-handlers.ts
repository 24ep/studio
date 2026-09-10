import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import { SimpleErrorHandler, createInternalServerError } from '@/lib/errors';
import { requireV1SettingsAdmin } from './settings-v1-auth';
import { fetchV1SettingsData } from './settings-v1-data';
import { buildV1SettingsResponse } from './settings-v1-transform';

export async function handleGetV1Settings(request: NextRequest) {
  try {
    const authResult = await requireV1SettingsAdmin(request);
    if (!authResult.ok) {
      return authResult.response;
    }

    const rows = await fetchV1SettingsData(authResult.user.id);
    return SimpleErrorHandler.createSuccessResponse(request, buildV1SettingsResponse(rows), 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError(`Failed to fetch settings: ${errorMessage}`)
    );
  }
}

export function handleV1SettingsOptions(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
