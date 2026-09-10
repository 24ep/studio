import { type NextRequest, NextResponse } from 'next/server';
import {
  requireCanReadUserPreferences,
  requireCanWriteUserPreferences,
  requireUserPreferencesSession,
} from './user-preferences-id-auth';
import {
  fetchUserPreferenceRows,
  upsertUserPreferenceSection,
} from './user-preferences-id-data';
import {
  LEGACY_USER_PREFERENCE_SECTIONS,
  type LegacyUserPreferenceSection,
  type UserPreferencesByIdRouteContext,
} from './user-preferences-id-schema';
import { transformLegacyUserPreferenceRows } from './user-preferences-id-transform';
import { readRequestJsonResult } from '@/lib/request-json';

export async function handleGetUserPreferencesById(
  _request: NextRequest,
  context: UserPreferencesByIdRouteContext
) {
  try {
    const sessionResult = await requireUserPreferencesSession();
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const { userId } = await context.params;
    const permissionError = requireCanReadUserPreferences(sessionResult.session.user, userId);
    if (permissionError) {
      return permissionError;
    }

    const preferences = await fetchUserPreferenceRows(userId);
    return NextResponse.json(transformLegacyUserPreferenceRows(preferences));
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 });
  }
}

export async function handlePostUserPreferencesById(
  request: NextRequest,
  context: UserPreferencesByIdRouteContext
) {
  try {
    const sessionResult = await requireUserPreferencesSession();
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const { userId } = await context.params;
    const permissionError = requireCanWriteUserPreferences(sessionResult.session.user, userId);
    if (permissionError) {
      return permissionError;
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = bodyResult.value;
    await Promise.all(
      LEGACY_USER_PREFERENCE_SECTIONS.map((section) => upsertSectionFromBody(userId, section, body))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ error: 'Failed to update user preferences' }, { status: 500 });
  }
}

function upsertSectionFromBody(userId: string, section: LegacyUserPreferenceSection, body: unknown) {
  if (!body || typeof body !== 'object' || !(section in body)) {
    return Promise.resolve([]);
  }

  const updates = (body as Record<LegacyUserPreferenceSection, unknown>)[section];
  if (!updates || typeof updates !== 'object') {
    return Promise.resolve([]);
  }

  return upsertUserPreferenceSection(userId, section, updates as Record<string, unknown>);
}
