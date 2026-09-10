import { getJsonString, isJsonObject, readJsonObject } from '../../lib/response-json';
import { DEFAULT_AI_POWER_SEARCH_PROMPT } from './ai-power-search-default-prompt';

const AI_POWER_SEARCH_SETTING_KEY = 'aiPowerSearchSystemPrompt';

export function normalizeAiPowerSearchPromptResponse(data: unknown) {
  const prompt = isJsonObject(data)
    ? getJsonString(data, AI_POWER_SEARCH_SETTING_KEY)
    : undefined;

  return prompt?.trim()
    ? prompt
    : DEFAULT_AI_POWER_SEARCH_PROMPT;
}

export function getAiPowerSearchSaveErrorMessage(data: unknown) {
  const message = isJsonObject(data) ? getJsonString(data, 'message') : undefined;
  return message?.trim() || 'Failed to save system prompt';
}

export async function fetchAiPowerSearchPrompt() {
  const response = await fetch('/api/settings/system-settings', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to load current system prompt');
  }

  return normalizeAiPowerSearchPromptResponse(await readJsonObject(response));
}

export async function saveAiPowerSearchPrompt(prompt: string) {
  const response = await fetch('/api/settings/system-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify([
      {
        key: AI_POWER_SEARCH_SETTING_KEY,
        value: prompt,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(getAiPowerSearchSaveErrorMessage(await readJsonObject(response)));
  }
}
