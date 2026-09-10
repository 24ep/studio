"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import {
  getProviderDefaultModel,
  getProviderLabel,
  type AiModelOption,
  type AiProvider,
  type ApiKey,
} from "./ai-api-keys-utils";
import {
  fetchAiApiKeys,
  fetchAiAvailableModels,
  saveAiProviderSelection,
} from "./ai-api-keys-api";

export function useAiApiKeysData() {
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>("gemini");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [availableModels, setAvailableModels] = useState<AiModelOption[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const hasAppliedInitialProviderRef = useRef(false);

  const providerLabel = getProviderLabel(selectedProvider);
  const providerDefaultModel = getProviderDefaultModel(selectedProvider);

  const fetchApiKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAiApiKeys(selectedProvider);

      if (
        !hasAppliedInitialProviderRef.current &&
        data.selectedProvider &&
        data.selectedProvider !== selectedProvider
      ) {
        setSelectedProvider(data.selectedProvider);
        return;
      }

      setApiKeys(data.apiKeys);
      hasAppliedInitialProviderRef.current = true;
      setHasLoadedOnce(true);
    } catch (error) {
      toast.error(error instanceof Error && error.message === "Invalid response format from server"
        ? error.message
        : "Failed to load API keys");
      console.error("Error fetching API keys:", error);
      setApiKeys([]);
      setHasLoadedOnce(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProvider]);

  const fetchAvailableModels = useCallback(async () => {
    if (apiKeys.length === 0) {
      setAvailableModels([]);
      return;
    }

    setIsFetchingModels(true);
    try {
      const data = await fetchAiAvailableModels(selectedProvider);
      setAvailableModels(data.models);

      if (data.error) {
        toast.error(data.error.startsWith("Failed to fetch available models")
          ? data.error
          : `Failed to fetch models: ${data.error}`);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      setAvailableModels([]);
      toast.error("Failed to fetch available models. Please ensure at least one API key is configured and valid.");
    } finally {
      setIsFetchingModels(false);
    }
  }, [apiKeys.length, selectedProvider]);

  const updateProviderSelection = useCallback(async (provider: AiProvider) => {
    if (provider === selectedProvider) return;

    setIsLoading(true);
    setApiKeys([]);
    setAvailableModels([]);
    setSelectedProvider(provider);
    try {
      await saveAiProviderSelection(provider);
    } catch (error) {
      console.error("Error saving AI provider selection:", error);
    }
  }, [selectedProvider]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  useEffect(() => {
    if (apiKeys.length > 0 && !isLoading) {
      fetchAvailableModels();
    }
  }, [apiKeys.length, isLoading, fetchAvailableModels]);

  return {
    apiKeys,
    availableModels,
    fetchApiKeys,
    isFetchingModels,
    hasLoadedOnce,
    isLoading,
    providerDefaultModel,
    providerLabel,
    selectedProvider,
    setApiKeys,
    updateProviderSelection,
  };
}
