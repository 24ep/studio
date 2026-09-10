import { type NextRequest } from 'next/server';
import {
  handleGetUserPreferencesById,
  handlePostUserPreferencesById,
} from './user-preferences-id-handlers';
import type { UserPreferencesByIdRouteContext } from './user-preferences-id-schema';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest, context: UserPreferencesByIdRouteContext) {
  return handleGetUserPreferencesById(request, context);
}

export function POST(request: NextRequest, context: UserPreferencesByIdRouteContext) {
  return handlePostUserPreferencesById(request, context);
}
