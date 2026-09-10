/**
 * Gemini Model Management
 * Handles fetching and caching available Gemini models from the API
 */

import {
  DEFAULT_GEMINI_MODEL,
  extractModelName,
  formatAvailableGeminiModels,
  getFallbackModels,
  getGeminiApiModels,
  isSafeGeminiModelName,
  type GeminiModelOption,
  type GeminiModelsResponse,
} from "./gemini-model-utils";
import { readJsonOrFallback } from "./response-json";

export { extractModelName } from "./gemini-model-utils";

let cachedModels: GeminiModelOption[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get available models from the API
 * Uses caching to avoid excessive API calls
 */
export async function getAvailableModels(apiKey: string): Promise<GeminiModelOption[]> {
  const now = Date.now();
  
  // Return cached models if still valid
  if (cachedModels && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedModels;
  }
  
  try {
    const url = "https://generativelanguage.googleapis.com/v1/models";
    
    const fetchRes = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
    });

    if (!fetchRes.ok) {
      console.warn('Failed to fetch available models, using fallback');
      return getFallbackModels();
    }

    const data = await readJsonOrFallback<GeminiModelsResponse>(fetchRes, {});
    
    if (data.error) {
      console.warn('Error fetching models:', data.error);
      return getFallbackModels();
    }

    const availableModels = formatAvailableGeminiModels(getGeminiApiModels(data));
    
    if (availableModels.length > 0) {
      cachedModels = availableModels;
      cacheTimestamp = now;
      return availableModels;
    }
    
    return getFallbackModels();
  } catch (error) {
    console.error('Error fetching available models:', error);
    return getFallbackModels();
  }
}

/**
 * Get the first available model name
 * Used as default fallback when no model is specified
 */
export async function getDefaultModelName(apiKey: string): Promise<string> {
  try {
    const models = await getAvailableModels(apiKey);
    if (models.length > 0) {
      return models[0].name;
    }
  } catch (error) {
    console.error('Error getting default model:', error);
  }
  
  // Ultimate fallback
  return DEFAULT_GEMINI_MODEL;
}

/**
 * Validate and normalize model name
 * Extracts model identifier and validates it's a known model
 * SECURITY: Validates input to prevent URL manipulation attacks
 */
export function normalizeModelName(modelName: string | undefined | null, availableModels?: Array<{ name: string }>): string {
  if (!modelName) {
    return DEFAULT_GEMINI_MODEL; // Default fallback
  }
  
  // Extract model name
  let normalized = extractModelName(modelName);
  
  if (!isSafeGeminiModelName(normalized)) {
    console.warn(`[SECURITY] Invalid model name format: ${normalized}, using fallback`);
    return DEFAULT_GEMINI_MODEL;
  }
  
  // If we have available models, check if this one exists
  if (availableModels && availableModels.length > 0) {
    const modelExists = availableModels.some(m => 
      extractModelName(m.name) === normalized || m.name === normalized
    );
    
    if (modelExists) {
      return normalized;
    }
    
    // If model doesn't exist, use first available
    console.warn(`Model ${normalized} not found in available models, using ${availableModels[0].name}`);
    return extractModelName(availableModels[0].name);
  }
  
  return normalized;
}

