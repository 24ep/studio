"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-hot-toast";

import {
  buildApiKeyAddPlan,
  deduplicateApiKeysForSave,
  toApiKeySavePayload,
  updateApiKeyModel,
  type AiProvider,
  type ApiKey,
} from "./ai-api-keys-utils";
import { saveAiApiKeys } from "./ai-api-keys-api";

interface UseAiApiKeySaveActionsOptions {
  apiKeys: ApiKey[];
  fetchApiKeys: () => Promise<void>;
  newApiKey: string;
  newPriority: number;
  providerDefaultModel: string;
  selectedProvider: AiProvider;
  setApiKeys: Dispatch<SetStateAction<ApiKey[]>>;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setNewApiKey: Dispatch<SetStateAction<string>>;
  setNewPriority: Dispatch<SetStateAction<number>>;
}

export function useAiApiKeySaveActions({
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
}: UseAiApiKeySaveActionsOptions) {
  const persistApiKeys = useCallback(async (
    updatedKeys: ApiKey[],
    fallbackMessage = "Failed to save API keys",
  ) => {
    setIsSaving(true);
    try {
      await saveAiApiKeys({
        apiKeys: deduplicateApiKeysForSave(updatedKeys, providerDefaultModel),
        provider: selectedProvider,
        fallbackMessage,
      });
      await fetchApiKeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : fallbackMessage);
      console.error("Error saving API keys:", error);
      await fetchApiKeys();
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [fetchApiKeys, providerDefaultModel, selectedProvider, setIsSaving]);

  const addApiKey = useCallback(async () => {
    const addPlan = buildApiKeyAddPlan({
      apiKeys,
      key: newApiKey,
      priority: newPriority,
      provider: selectedProvider,
      providerDefaultModel,
    });

    if (!addPlan.ok) {
      toast.error(addPlan.message);
      return false;
    }

    if (addPlan.adjustedPriority) {
      toast(`Priority ${newPriority} already exists. Adjusted to ${addPlan.finalPriority}`);
    }

    setApiKeys(addPlan.updatedKeys);
    setNewApiKey("");
    setNewPriority(addPlan.updatedKeys.length + 1);
    setIsSaving(true);

    try {
      await saveAiApiKeys({
        apiKeys: toApiKeySavePayload(addPlan.updatedKeys, providerDefaultModel),
        provider: selectedProvider,
        fallbackMessage: "Failed to save API key",
      });
      toast.success("API key added successfully");
      await fetchApiKeys();
      return true;
    } catch (error) {
      setApiKeys([...apiKeys]);
      setNewApiKey(addPlan.trimmedKey);
      toast.error(error instanceof Error ? error.message : "Failed to save API key");
      console.error("Error saving API key:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
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
  ]);

  const handleModelChange = useCallback(async (apiKey: ApiKey, value: string) => {
    const previousKeys = [...apiKeys];
    const updatedKeys = updateApiKeyModel(apiKeys, apiKey.priority, value);
    setApiKeys(updatedKeys);

    try {
      await saveAiApiKeys({
        apiKeys: toApiKeySavePayload(updatedKeys, providerDefaultModel),
        provider: selectedProvider,
        fallbackMessage: "Failed to save model selection",
      });

      await fetchApiKeys();
    } catch (error) {
      setApiKeys(previousKeys);
      toast.error(error instanceof Error ? error.message : "Failed to save model selection");
      console.error("Error saving model selection:", error);
    }
  }, [apiKeys, fetchApiKeys, providerDefaultModel, selectedProvider, setApiKeys]);

  const saveApiKeys = useCallback(async () => {
    setIsSaving(true);
    try {
      const data = await saveAiApiKeys({
        apiKeys: deduplicateApiKeysForSave(apiKeys, providerDefaultModel),
        provider: selectedProvider,
      });

      if (data.removedDuplicates && data.removedDuplicates > 0) {
        toast.success(`${data.message} (${data.removedDuplicates} duplicate(s) removed)`);
      } else {
        toast.success(data.message || "API keys saved successfully");
      }

      await fetchApiKeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save API keys");
      console.error("Error saving API keys:", error);
      await fetchApiKeys();
    } finally {
      setIsSaving(false);
    }
  }, [apiKeys, fetchApiKeys, providerDefaultModel, selectedProvider, setIsSaving]);

  return {
    addApiKey,
    handleModelChange,
    persistApiKeys,
    saveApiKeys,
  };
}
