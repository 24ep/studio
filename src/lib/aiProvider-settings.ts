import { getSystemSetting } from './systemSettings';
import type { AiModelInfo, AiProvider } from './aiProvider-types';

const MODEL_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export async function getSelectedAiProvider(): Promise<AiProvider> {
  const selectedProvider = await getSystemSetting('aiProviderSelection');
  if (selectedProvider === 'openai' || selectedProvider === 'deepseek') {
    return selectedProvider;
  }

  return 'gemini';
}

export function getProviderKeyPrefix(provider: AiProvider): string {
  if (provider === 'openai') return 'openaiApiKey';
  if (provider === 'deepseek') return 'deepseekApiKey';
  return 'geminiApiKey';
}

export function getProviderLabel(provider: AiProvider): string {
  if (provider === 'openai') return 'OpenAI';
  if (provider === 'deepseek') return 'DeepSeek';
  return 'Google Gemini';
}

export function getProviderModelSettingKey(provider: AiProvider): string {
  if (provider === 'openai') return 'openaiModelSelection';
  if (provider === 'deepseek') return 'deepseekModelSelection';
  return 'geminiModelSelection';
}

export function getDefaultModelFallback(provider: AiProvider): string {
  if (provider === 'openai') return 'gpt-4o-mini';
  if (provider === 'deepseek') return 'deepseek-chat';
  return 'gemini-1.5-flash';
}

export function normalizeModelName(
  provider: AiProvider,
  modelName: string | undefined | null,
  availableModels?: Array<{ name: string }>
): string {
  const fallback = getDefaultModelFallback(provider);
  if (!modelName) {
    return fallback;
  }

  const normalized = modelName.startsWith('models/')
    ? modelName.replace(/^models\//, '')
    : modelName;

  if (!MODEL_NAME_PATTERN.test(normalized) || normalized.includes('..') || normalized.includes('/') || normalized.includes('\\')) {
    return fallback;
  }

  if (availableModels?.length) {
    const matched = availableModels.find((model) => {
      const candidate = model.name.startsWith('models/')
        ? model.name.replace(/^models\//, '')
        : model.name;
      return candidate === normalized;
    });

    if (matched) {
      return normalized;
    }

    return availableModels[0].name.startsWith('models/')
      ? availableModels[0].name.replace(/^models\//, '')
      : availableModels[0].name;
  }

  return normalized;
}

export function getFallbackModels(provider: AiProvider): AiModelInfo[] {
  if (provider === 'openai') {
    return [
      { name: 'gpt-4o-mini', displayName: 'gpt-4o-mini', description: 'Fast and cost-efficient OpenAI model', supportedGenerationMethods: ['chat.completions'] },
      { name: 'gpt-4o', displayName: 'gpt-4o', description: 'General-purpose OpenAI model', supportedGenerationMethods: ['chat.completions'] },
      { name: 'gpt-4.1-mini', displayName: 'gpt-4.1-mini', description: 'Compact GPT-4.1 model', supportedGenerationMethods: ['chat.completions'] },
      { name: 'gpt-4.1', displayName: 'gpt-4.1', description: 'Advanced GPT-4.1 model', supportedGenerationMethods: ['chat.completions'] },
    ];
  }

  if (provider === 'deepseek') {
    return [
      { name: 'deepseek-chat', displayName: 'deepseek-chat', description: 'DeepSeek chat model', supportedGenerationMethods: ['chat.completions'] },
      { name: 'deepseek-reasoner', displayName: 'deepseek-reasoner', description: 'DeepSeek reasoning model', supportedGenerationMethods: ['chat.completions'] },
    ];
  }

  return [
    { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', description: 'Fast Gemini model', supportedGenerationMethods: ['generateContent'] },
    { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', description: 'Capable Gemini model', supportedGenerationMethods: ['generateContent'] },
    { name: 'gemini-2.0-flash-exp', displayName: 'Gemini 2.0 Flash Experimental', description: 'Experimental Gemini model', supportedGenerationMethods: ['generateContent'] },
  ];
}
