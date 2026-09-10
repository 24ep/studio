import {
  VALID_USER_PREFERENCE_MODEL_TYPES,
  type NormalizedModelType,
} from './user-preferences-route-types';

export function isValidUserPreferenceModelType(modelType: unknown): modelType is typeof VALID_USER_PREFERENCE_MODEL_TYPES[number] {
  return typeof modelType === 'string' && VALID_USER_PREFERENCE_MODEL_TYPES.includes(modelType as typeof VALID_USER_PREFERENCE_MODEL_TYPES[number]);
}

export function normalizeUserPreferenceModelType(modelType: string): NormalizedModelType {
  return modelType === 'applicants' ? 'Applicants' : modelType as NormalizedModelType;
}
