import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getJsonObject, getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
import prisma from '@/lib/prisma';
import {
  buildUserPreferenceUpserts,
  isValidUserPreferenceModelType,
  normalizeUserPreferenceModelType,
  transformUserPreferenceRows,
} from './user-preferences-route-utils';

export const dynamic = 'force-dynamic';

async function requireCurrentUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

async function fetchUserPreferencesWithTimeout(userId: string) {
  return Promise.race([
    prisma.userUIDisplayPreference.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        modelType: true,
        attributeKey: true,
        uiPreference: true,
      },
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 8000)),
  ]);
}

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await fetchUserPreferencesWithTimeout(userId);
    return NextResponse.json(transformUserPreferenceRows(preferences));
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readRequestJsonObject(request);
    const modelType = getJsonString(body, 'modelType');
    const updates = getJsonObject(body, 'updates');

    if (!isValidUserPreferenceModelType(modelType) || !updates || typeof updates !== 'object') {
      return NextResponse.json({
        error: 'Missing or invalid preference fields.',
      }, { status: 400 });
    }

    const upserts = buildUserPreferenceUpserts(userId, modelType, updates as Record<string, unknown>);
    await Promise.all(upserts.map((preference) => (
      prisma.userUIDisplayPreference.upsert({
        where: {
          userId_modelType_attributeKey: {
            userId,
            modelType: preference.modelType,
            attributeKey: preference.attributeKey,
          },
        },
        update: {
          uiPreference: preference.uiPreference,
          updatedAt: preference.updatedAt,
        },
        create: {
          userId,
          modelType: preference.modelType,
          attributeKey: preference.attributeKey,
          uiPreference: preference.uiPreference,
        },
      })
    )));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ error: 'Failed to update user preferences' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modelType = new URL(request.url).searchParams.get('modelType');
    if (modelType && !isValidUserPreferenceModelType(modelType)) {
      return NextResponse.json({
        error: 'Invalid preference model type.',
      }, { status: 400 });
    }

    await prisma.userUIDisplayPreference.deleteMany({
      where: modelType
        ? { userId, modelType: normalizeUserPreferenceModelType(modelType) }
        : { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    return NextResponse.json({ error: 'Failed to reset user preferences' }, { status: 500 });
  }
}
