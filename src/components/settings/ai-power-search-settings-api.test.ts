import { describe, expect, it } from 'vitest';

import { DEFAULT_AI_POWER_SEARCH_PROMPT } from './ai-power-search-default-prompt';
import {
  getAiPowerSearchSaveErrorMessage,
  normalizeAiPowerSearchPromptResponse,
} from './ai-power-search-settings-api';

describe('ai power search settings api helpers', () => {
  it('normalizes the configured prompt or falls back to the default prompt', () => {
    expect(normalizeAiPowerSearchPromptResponse({
      aiPowerSearchSystemPrompt: 'Custom prompt',
    })).toBe('Custom prompt');
    expect(normalizeAiPowerSearchPromptResponse({
      aiPowerSearchSystemPrompt: '   ',
    })).toBe(DEFAULT_AI_POWER_SEARCH_PROMPT);
    expect(normalizeAiPowerSearchPromptResponse(null)).toBe(DEFAULT_AI_POWER_SEARCH_PROMPT);
  });

  it('reads save error messages safely', () => {
    expect(getAiPowerSearchSaveErrorMessage({ message: 'No permission' })).toBe('No permission');
    expect(getAiPowerSearchSaveErrorMessage({ message: '' })).toBe('Failed to save system prompt');
    expect(getAiPowerSearchSaveErrorMessage(null)).toBe('Failed to save system prompt');
  });
});
