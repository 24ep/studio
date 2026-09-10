import { getSystemSetting } from './systemSettings';
import { getApiKeys } from './aiApiKeyManager';
import { normalizeModelName, getDefaultModelName } from './geminiModels';

/**
 * Get the selected Gemini model from the highest priority API key
 * Falls back to dynamically fetched available models or 'gemini-1.0-pro' if no model is configured
 */
export async function getSelectedGeminiModel(): Promise<string> {
  try {
    const apiKeys = await getApiKeys();
    const activeKeys = apiKeys.filter(key => key.isActive).sort((a, b) => a.priority - b.priority);
    
    if (activeKeys.length > 0) {
      const modelName = normalizeModelName(activeKeys[0].selectedModel);
      return modelName;
    }
    
    // Fallback to system setting
    const selectedModel = await getSystemSetting('geminiModelSelection');
    if (selectedModel) {
      return normalizeModelName(selectedModel);
    }
    
    // Ultimate fallback - try to get from API if we have keys
    if (activeKeys.length > 0) {
      try {
        return await getDefaultModelName(activeKeys[0].key);
      } catch (error) {
        console.error('Error getting default model from API:', error);
      }
    }
    
    return 'gemini-1.0-pro'; // Default fallback
  } catch (error) {
    console.error('Error getting selected Gemini model:', error);
    return 'gemini-1.0-pro'; // Default fallback
  }
}

/**
 * Build the Gemini API URL with the selected model
 */
export async function buildGeminiApiUrl(): Promise<string> {
  const model = await getSelectedGeminiModel();
  return `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
}
