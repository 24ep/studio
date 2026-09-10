import type { AiProvider, ApiKey } from "./ai-api-keys-utils";

export function getApiKeyPreview(apiKey: string) {
  return apiKey.length > 20
    ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
    : apiKey;
}

export function createNewApiKey(
  key: string,
  priority: number,
  provider: AiProvider,
  selectedModel: string,
): ApiKey {
  return {
    key,
    priority,
    isActive: true,
    source: `Priority ${priority}`,
    errorCount: 0,
    selectedModel,
    provider,
  };
}
