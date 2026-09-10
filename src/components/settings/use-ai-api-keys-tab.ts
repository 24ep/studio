"use client";

import { useAiApiKeysActions } from "./use-ai-api-keys-actions";
import { useAiApiKeysData } from "./use-ai-api-keys-data";

export function useAiApiKeysTab() {
  const data = useAiApiKeysData();
  const actionState = useAiApiKeysActions({
    apiKeys: data.apiKeys,
    fetchApiKeys: data.fetchApiKeys,
    providerDefaultModel: data.providerDefaultModel,
    selectedProvider: data.selectedProvider,
    setApiKeys: data.setApiKeys,
    updateProviderSelection: data.updateProviderSelection,
  });

  return {
    apiKeys: data.apiKeys,
    availableModels: data.availableModels,
    deletingKey: actionState.deletingKey,
    editingKey: actionState.editingKey,
    editValue: actionState.editValue,
    isFetchingModels: data.isFetchingModels,
    hasLoadedOnce: data.hasLoadedOnce,
    isLoading: data.isLoading,
    isSaving: actionState.isSaving,
    newApiKey: actionState.newApiKey,
    newPriority: actionState.newPriority,
    providerDefaultModel: data.providerDefaultModel,
    providerLabel: data.providerLabel,
    selectedProvider: data.selectedProvider,
    actions: actionState.actions,
  };
}
