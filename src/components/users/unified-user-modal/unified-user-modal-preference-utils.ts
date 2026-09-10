import type {
  ModalMode,
  UnifiedUserPreferenceUpdates,
} from './types';

export function buildUnifiedUserPreferencesEndpoint({
  mode,
  targetUserId,
  sessionUserId,
  modelType,
}: {
  mode: ModalMode;
  targetUserId?: string | null;
  sessionUserId?: string | null;
  modelType?: string;
}) {
  const baseEndpoint = mode === 'profile' || targetUserId === sessionUserId
    ? '/api/user-preferences'
    : `/api/user-preferences/${targetUserId}`;

  return modelType ? `${baseEndpoint}?modelType=${modelType}` : baseEndpoint;
}

export function mergeUnifiedUserPreferenceModel<T extends object | null>(
  preferences: T,
  modelType: string,
  updates: UnifiedUserPreferenceUpdates
): T {
  if (!preferences) {
    return preferences;
  }

  const preferenceRecord = preferences as Record<string, unknown>;
  const currentModel = preferenceRecord[modelType];
  const currentModelRecord = currentModel && typeof currentModel === 'object'
    ? currentModel as Record<string, unknown>
    : {};

  return {
    ...preferenceRecord,
    [modelType]: {
      ...currentModelRecord,
      ...updates,
    },
  } as T;
}
