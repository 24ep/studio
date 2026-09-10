import prisma from '@/lib/prisma';
import { buildUserPreferenceUpserts } from '../user-preferences-route-utils';
import type { LegacyUserPreferenceSection } from './user-preferences-id-schema';

export function fetchUserPreferenceRows(userId: string) {
  return prisma.userUIDisplayPreference.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: {
      modelType: true,
      attributeKey: true,
      uiPreference: true,
    },
  });
}

export function upsertUserPreferenceSection(
  userId: string,
  section: LegacyUserPreferenceSection,
  updates: Record<string, unknown>
) {
  const upserts = buildUserPreferenceUpserts(userId, section, updates);
  return Promise.all(upserts.map((preference) => (
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
}
