import type { AiModelOption, AiProvider, ApiKey } from "./ai-api-keys-utils";
import type { useAiApiKeysTab } from "./use-ai-api-keys-tab";

export type AiApiKeysActions = ReturnType<typeof useAiApiKeysTab>["actions"];

export interface AiApiKeysAccordionProps {
  apiKeys: ApiKey[];
  availableModels: AiModelOption[];
  deletingKey: number | null;
  editingKey: string | null;
  editValue: string;
  isFetchingModels: boolean;
  isLoading: boolean;
  isSaving: boolean;
  newApiKey: string;
  newPriority: number;
  providerDefaultModel: string;
  providerLabel: string;
  selectedProvider: AiProvider;
  actions: AiApiKeysActions;
}

export interface AiApiKeysFooterProps {
  apiKeys: ApiKey[];
  isSaving: boolean;
  onSave: () => void;
}
