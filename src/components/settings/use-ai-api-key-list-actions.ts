"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";

import {
  removeApiKeyByPriority,
  reorderApiKeysByDrag,
  toApiKeySavePayload,
  type AiProvider,
  type ApiKey,
} from "./ai-api-keys-utils";
import {
  reorderAiApiKeys,
  saveAiApiKeys,
} from "./ai-api-keys-api";
import { getApiKeyPreview } from "./ai-api-keys-tab-utils";

interface UseAiApiKeyListActionsOptions {
  apiKeys: ApiKey[];
  fetchApiKeys: () => Promise<void>;
  providerDefaultModel: string;
  selectedProvider: AiProvider;
  setApiKeys: Dispatch<SetStateAction<ApiKey[]>>;
  setDeletingKey: Dispatch<SetStateAction<number | null>>;
}

export function useAiApiKeyListActions({
  apiKeys,
  fetchApiKeys,
  providerDefaultModel,
  selectedProvider,
  setApiKeys,
  setDeletingKey,
}: UseAiApiKeyListActionsOptions) {
  const removeApiKey = useCallback(async (priority: number) => {
    const { keyToDelete, updatedKeys } = removeApiKeyByPriority(apiKeys, priority);
    if (!keyToDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the API key with priority ${priority}?\n\nKey: ${getApiKeyPreview(keyToDelete.key)}\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingKey(priority);
    try {
      setApiKeys(updatedKeys);

      await saveAiApiKeys({
        apiKeys: toApiKeySavePayload(updatedKeys, providerDefaultModel),
        provider: selectedProvider,
        fallbackMessage: "Failed to delete API key",
      });

      toast.success("API key deleted successfully");
    } catch (error) {
      fetchApiKeys();
      toast.error(error instanceof Error ? error.message : "Failed to delete API key");
      console.error("Error deleting API key:", error);
    } finally {
      setDeletingKey(null);
    }
  }, [
    apiKeys,
    fetchApiKeys,
    providerDefaultModel,
    selectedProvider,
    setApiKeys,
    setDeletingKey,
  ]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || apiKeys.length === 0 || result.source.index === result.destination.index) {
      return;
    }

    const updatedItems = reorderApiKeysByDrag(apiKeys, result.source.index, result.destination.index);
    if (!updatedItems || updatedItems.length === 0) {
      toast.error("No API keys to reorder");
      fetchApiKeys();
      return;
    }

    setApiKeys(updatedItems);

    try {
      await reorderAiApiKeys({
        apiKeys: toApiKeySavePayload(updatedItems, providerDefaultModel),
        provider: selectedProvider,
      });

      toast.success("API key order updated successfully");
    } catch (error) {
      console.error("Failed to reorder:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update API key order");
      fetchApiKeys();
    }
  }, [apiKeys, fetchApiKeys, providerDefaultModel, selectedProvider, setApiKeys]);

  return {
    handleDragEnd,
    removeApiKey,
  };
}
