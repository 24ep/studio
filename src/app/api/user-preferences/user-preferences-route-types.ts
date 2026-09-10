export const VALID_USER_PREFERENCE_MODEL_TYPES = ['taskBoard', 'positions', 'appearance', 'Applicants', 'applicants', 'sidebar', 'accessibility'] as const;

export type NormalizedModelType = 'taskBoard' | 'positions' | 'appearance' | 'Applicants' | 'sidebar' | 'accessibility';

export interface UserPreferenceRow {
  modelType: string;
  attributeKey: string;
  uiPreference: string | null;
}

export interface UserPreferenceCreateInput {
  userId: string;
  modelType: NormalizedModelType;
  attributeKey: string;
  uiPreference: string;
}

export interface UserPreferenceUpsertInput extends UserPreferenceCreateInput {
  updatedAt: Date;
}
