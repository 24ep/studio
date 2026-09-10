import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GEMINI_MODELS,
  buildAiConfigurationSettingsPayload,
  getCurrentAiModel,
  normalizeAiConfiguration,
  normalizeAvailableModelsResponse,
} from './ai-configuration-utils';

describe('ai-configuration-utils', () => {
  it('normalizes saved AI configuration values', () => {
    expect(normalizeAiConfiguration({
      geminiModelSelection: 'gemini-custom',
      aiPowerSearchSystemPrompt: 'Search carefully',
    })).toEqual({
      geminiModelSelection: 'gemini-custom',
      aiPowerSearchSystemPrompt: 'Search carefully',
    });

    expect(normalizeAiConfiguration(null)).toEqual({
      geminiModelSelection: 'gemini-1.5-pro',
      aiPowerSearchSystemPrompt: '',
    });
  });

  it('normalizes available model responses with fallback defaults', () => {
    const model = {
      name: 'gemini-test',
      displayName: 'Gemini Test',
      description: 'Test model',
      supportedGenerationMethods: ['generateContent'],
    };

    expect(normalizeAvailableModelsResponse({ success: true, models: [model, { name: 'bad' }] })).toEqual({
      models: [model],
      error: null,
    });

    expect(normalizeAvailableModelsResponse({ success: false, error: 'No key' })).toEqual({
      models: DEFAULT_GEMINI_MODELS,
      error: 'No key',
    });
  });

  it('selects current model and builds save payloads', () => {
    expect(getCurrentAiModel(DEFAULT_GEMINI_MODELS, 'gemini-1.5-flash')?.displayName).toBe('Gemini 1.5 Flash');
    expect(getCurrentAiModel(DEFAULT_GEMINI_MODELS, 'missing')?.name).toBe('gemini-1.5-pro');
    expect(buildAiConfigurationSettingsPayload({
      selectedModel: 'gemini-1.5-pro',
      systemPrompt: 'Prompt',
    })).toEqual([
      { key: 'geminiModelSelection', value: 'gemini-1.5-pro' },
      { key: 'aiPowerSearchSystemPrompt', value: 'Prompt' },
    ]);
  });
});
