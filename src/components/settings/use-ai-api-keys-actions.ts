"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import {
  getNextPriority,
  type AiProvider,
  type ApiKey,
} from "./ai-api-keys-utils";
import { useAiApiKeyEditing } from "./use-ai-api-key-editing";
import { useAiApiKeyListActions } from "./use-ai-api-key-list-actions";
import { useAiApiKeySaveActions } from "./use-ai-api-key-save-actions";

interface UseAiApiKeysActionsOptions {
  apiKeys: ApiKey[];
  fetchApiKeys: () => Promise<void>;
  providerDefaultModel: string;
  selectedProvider: AiProvider;
  setApiKeys: Dispatch<SetStateAction<ApiKey[]>>;
  updateProviderSelection: (provider: AiProvider) => Promise<void>;
}

export function useAiApiKeysActions({
  apiKeys,
  fetchApiKeys,
  providerDefaultModel,
  selectedProvider,
  setApiKeys,
  updateProviderSelection,
}: UseAiApiKeysActionsOptions) {
  const [newApiKey, setNewApiKey] = useState("");
  const [newPriority, setNewPriority] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<number | null>(null);
  useEffect(() => {
    setNewPriority(getNextPriority(apiKeys));
  }, [apiKeys]);

  const {
    addApiKey,
    handleModelChange,
    persistApiKeys,
    saveApiKeys,
  } = useAiApiKeySaveActions({
    apiKeys,
    fetchApiKeys,
    newApiKey,
    newPriority,
    providerDefaultModel,
    selectedProvider,
    setApiKeys,
    setIsSaving,
    setNewApiKey,
    setNewPriority,
  });
  const {
    cancelEditing,
    editingKey,
    editValue,
    saveEditing,
    setEditValue,
    startEditing,
  } = useAiApiKeyEditing({
    apiKeys,
    onSaveKeys: persistApiKeys,
    setApiKeys,
  });

  const {
    handleDragEnd,
    removeApiKey,
  } = useAiApiKeyListActions({
    apiKeys,
    fetchApiKeys,
    providerDefaultModel,
    selectedProvider,
    setApiKeys,
    setDeletingKey,
  });

  return {
    deletingKey,
    editingKey,
    editValue,
    isSaving,
    newApiKey,
    newPriority,
    actions: {
      addApiKey,
      cancelEditing,
      fetchApiKeys,
      handleDragEnd,
      handleModelChange,
      removeApiKey,
      saveApiKeys,
      saveEditing,
      setEditValue,
      setNewApiKey,
      setNewPriority,
      startEditing,
      updateProviderSelection,
    },
  };
}
