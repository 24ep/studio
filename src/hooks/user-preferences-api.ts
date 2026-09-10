import {
  defaultPreferences,
  mergeUserPreferences,
  type PreferenceModelType,
  type UserPreferences,
} from './user-preferences-defaults';
import { readJsonOrFallback } from '../lib/response-json';

const PREFERENCES_ENDPOINT = '/api/user-preferences';
const PREFERENCE_REQUEST_TIMEOUT_MS = 5000;
const PREFERENCE_SAVE_DEBOUNCE_MS = 5000;
const PREFERENCE_SAVE_MAX_RETRIES = 3;

function waitForRetryDelay() {
  return new Promise(resolve => setTimeout(resolve, PREFERENCE_SAVE_DEBOUNCE_MS));
}

function isRetryableSaveError(error: unknown) {
  return (
    (error instanceof Error && error.name === 'TimeoutError') ||
    (error instanceof TypeError && error.message.includes('fetch'))
  );
}

export async function loadUserPreferencesFromApi(): Promise<UserPreferences> {
  try {
    const response = await fetch(PREFERENCES_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      signal: AbortSignal.timeout(PREFERENCE_REQUEST_TIMEOUT_MS),
    });

    if (response.ok) {
      return mergeUserPreferences(await readJsonOrFallback<Partial<UserPreferences>>(response, {}));
    }

    console.warn('Failed to load user preferences from database, using defaults');
  } catch (error) {
    console.warn('Error loading user preferences from database:', error);
  }

  return defaultPreferences;
}

export async function saveUserPreferenceModel(
  modelType: PreferenceModelType,
  updates: unknown
) {
  let retryCount = 0;

  while (retryCount < PREFERENCE_SAVE_MAX_RETRIES) {
    try {
      const response = await fetch(PREFERENCES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelType, updates }),
        credentials: 'include',
        signal: AbortSignal.timeout(PREFERENCE_REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        return;
      }

      console.warn(`Failed to save user preferences to database: ${response.status} ${response.statusText}`);
      if (response.status < 500) {
        return;
      }
    } catch (error) {
      console.warn(`Error saving user preferences to database (attempt ${retryCount + 1}):`, error);

      if (!isRetryableSaveError(error)) {
        return;
      }

      if (error instanceof Error && error.name === 'TimeoutError') {
        console.warn('User preferences save timed out, will retry...');
      }
    }

    retryCount++;
    if (retryCount < PREFERENCE_SAVE_MAX_RETRIES) {
      await waitForRetryDelay();
    }
  }
}

export async function resetUserPreferenceModel(modelType: PreferenceModelType) {
  try {
    const response = await fetch(`${PREFERENCES_ENDPOINT}?modelType=${modelType}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      return true;
    }

    console.warn(`Failed to reset ${modelType} preferences in database`);
  } catch (error) {
    console.warn(`Error resetting ${modelType} preferences:`, error);
  }

  return false;
}

export async function resetAllUserPreferences() {
  try {
    const response = await fetch(PREFERENCES_ENDPOINT, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      return true;
    }

    console.warn('Failed to reset all preferences in database');
  } catch (error) {
    console.warn('Error resetting all preferences:', error);
  }

  return false;
}
