import { normalizeUserPreferenceModelType } from './user-preferences-model-utils';
import { serializePreferenceValue } from './user-preferences-parsers';
import type { UserPreferenceUpsertInput } from './user-preferences-route-types';

export function buildUserPreferenceUpserts(userId: string, modelType: string, updates: Record<string, unknown>) {
  const dbModelType = normalizeUserPreferenceModelType(modelType);
  const updatedAt = new Date();

  return Object.entries(updates).map(([key, value]): UserPreferenceUpsertInput => ({
    userId,
    modelType: dbModelType,
    attributeKey: key,
    uiPreference: serializePreferenceValue(value),
    updatedAt,
  }));
}
