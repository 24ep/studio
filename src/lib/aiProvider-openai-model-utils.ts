import type { AiModelInfo } from './aiProvider-types';
import { getArrayProperty, getStringProperty } from './aiProvider-object-utils';

const OPENAI_PREFERRED_MODEL_ORDER = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1-mini',
  'gpt-4.1',
  'o4-mini',
  'o3',
];

export function buildOpenAiModelList(data: unknown): AiModelInfo[] {
  return Array.from(new Set(getOpenAiPreferredModelIds(data)))
    .map((name) => ({
      name,
      displayName: name,
      description: 'OpenAI text generation model',
      supportedGenerationMethods: ['chat.completions'],
    }));
}

function getOpenAiPreferredModelIds(data: unknown) {
  return getArrayProperty(data, 'data')
    .map(getOpenAiModelId)
    .filter(isSupportedOpenAiTextModel)
    .sort(sortOpenAiModels);
}

function getOpenAiModelId(model: unknown) {
  return getStringProperty(model, 'id') || '';
}

function isSupportedOpenAiTextModel(id: string) {
  return /^(gpt-|o[134]|chatgpt-)/.test(id) &&
    !/-(audio|realtime|transcribe|vision-preview|search|instruct)/.test(id);
}

function sortOpenAiModels(a: string, b: string): number {
  const indexA = OPENAI_PREFERRED_MODEL_ORDER.indexOf(a);
  const indexB = OPENAI_PREFERRED_MODEL_ORDER.indexOf(b);

  if (indexA !== -1 || indexB !== -1) {
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  }

  return a.localeCompare(b);
}
