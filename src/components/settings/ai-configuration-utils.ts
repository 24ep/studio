export interface GeminiModel {
  name: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
}

export interface AiConfigurationData {
  geminiModelSelection?: string;
  aiPowerSearchSystemPrompt?: string;
}

export const DEFAULT_GEMINI_MODELS: GeminiModel[] = [
  {
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Most capable model for complex tasks',
    supportedGenerationMethods: ['generateContent'],
  },
  {
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Fast and efficient model for quick responses',
    supportedGenerationMethods: ['generateContent'],
  },
];

export function normalizeAiConfiguration(data: unknown): Required<AiConfigurationData> {
  const record = asRecord(data);

  return {
    geminiModelSelection: getString(record?.geminiModelSelection) || 'gemini-1.5-pro',
    aiPowerSearchSystemPrompt: getString(record?.aiPowerSearchSystemPrompt) || '',
  };
}

export function normalizeAvailableModelsResponse(data: unknown) {
  const record = asRecord(data);

  if (record?.success === true && Array.isArray(record.models)) {
    const models = record.models.filter(isGeminiModel);
    if (models.length > 0) {
      return { models, error: null };
    }
  }

  return {
    models: DEFAULT_GEMINI_MODELS,
    error: getString(record?.error) || 'No models returned',
  };
}

export function getCurrentAiModel(availableModels: GeminiModel[], selectedModel: string) {
  return availableModels.find((model) => model.name === selectedModel) || availableModels[0] || null;
}

export function buildAiConfigurationSettingsPayload({
  selectedModel,
  systemPrompt,
}: {
  selectedModel: string;
  systemPrompt: string;
}) {
  return [
    { key: 'geminiModelSelection', value: selectedModel },
    { key: 'aiPowerSearchSystemPrompt', value: systemPrompt },
  ];
}

export function getAiConfigurationErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function isGeminiModel(value: unknown): value is GeminiModel {
  const record = asRecord(value);
  return typeof record?.name === 'string'
    && typeof record.displayName === 'string'
    && typeof record.description === 'string'
    && Array.isArray(record.supportedGenerationMethods)
    && record.supportedGenerationMethods.every((method) => typeof method === 'string');
}
