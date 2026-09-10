import type { PositionLevel } from '@/lib/types';
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from '../../lib/response-json';

import type { PositionLevelFormData } from './position-levels-types';

const POSITION_LEVELS_API = '/api/settings/position-levels';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function fetchPositionLevels() {
  const response = await fetch(POSITION_LEVELS_API);

  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(
      response,
      { message: 'Failed to fetch position levels' }
    );
    console.error('[PositionLevelsTab] API error:', errorData);
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return readJsonOrFallback<PositionLevel[]>(response, []);
}

export async function savePositionLevel(levelId: string | null, data: PositionLevelFormData) {
  const response = await fetch(
    levelId ? `${POSITION_LEVELS_API}/${levelId}` : POSITION_LEVELS_API,
    {
      method: levelId ? 'PUT' : 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to save position level'));
  }
}

export async function deletePositionLevel(levelId: string) {
  const response = await fetch(`${POSITION_LEVELS_API}/${levelId}`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to delete position level'));
  }
}

export async function updatePositionLevelSortOrder(
  levelId: string,
  data: PositionLevelFormData
) {
  await savePositionLevel(levelId, data);
}

export async function loadPositionLevelsFromAppKit(environment: 'development' | 'production') {
  const response = await fetch(`${POSITION_LEVELS_API}/import-appkit`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ environment }),
  });

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to load position levels from AppKit'));
  }
}
