import type { AiModelInfo, AiProvider } from './aiProvider-types';
import { fetchDeepSeekModels } from './aiProvider-deepseek';
import { fetchGeminiModels } from './aiProvider-gemini';
import { fetchOpenAiModels } from './aiProvider-openai';
import { getDefaultModelFallback, normalizeModelName } from './aiProvider-settings';

const modelCache = new Map<string, { timestamp: number; models: AiModelInfo[] }>();
const CACHE_DURATION = 5 * 60 * 1000;

export async function getAvailableModels(provider: AiProvider, apiKey: string): Promise<AiModelInfo[]> {
  const cacheKey = `${provider}:${apiKey.slice(0, 12)}`;
  const cached = modelCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.models;
  }

  const models = provider === 'openai'
    ? await fetchOpenAiModels(apiKey)
    : provider === 'deepseek'
      ? await fetchDeepSeekModels(apiKey)
      : await fetchGeminiModels(apiKey);

  modelCache.set(cacheKey, {
    timestamp: Date.now(),
    models,
  });

  return models;
}

export async function getDefaultModelName(provider: AiProvider, apiKey: string): Promise<string> {
  try {
    const models = await getAvailableModels(provider, apiKey);
    if (models.length > 0) {
      return normalizeModelName(provider, models[0].name, models);
    }
  } catch (error) {
    console.error(`[AI] Failed to get default ${provider} model:`, error);
  }

  return getDefaultModelFallback(provider);
}
