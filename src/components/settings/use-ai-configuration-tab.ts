import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from '@/lib/response-json';
import {
  buildAiConfigurationSettingsPayload,
  getAiConfigurationErrorMessage,
  getCurrentAiModel,
  normalizeAiConfiguration,
  normalizeAvailableModelsResponse,
  type GeminiModel,
} from './ai-configuration-utils';

export function useAiConfigurationTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [error, setError] = useState('');

  const fetchAvailableModels = useCallback(async () => {
    setIsFetchingModels(true);
    setError('');

    try {
      const response = await fetch('/api/ai/available-models');
      if (!response.ok) {
        throw new Error('Failed to fetch available models');
      }

      const normalized = normalizeAvailableModelsResponse(await readJsonOrFallback<unknown>(response, {}));
      setAvailableModels(normalized.models);

      if (normalized.error) {
        throw new Error(normalized.error);
      }

      toast.success(`Found ${normalized.models.length} available models`);
    } catch (error) {
      console.error('Error fetching models:', error);
      setError(getAiConfigurationErrorMessage(error, 'Failed to fetch models'));
      setAvailableModels(normalizeAvailableModelsResponse(null).models);
      toast.error('Using default models - API fetch failed');
    } finally {
      setIsFetchingModels(false);
    }
  }, []);

  const loadConfiguration = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/settings/system-settings?keys=geminiModelSelection,aiPowerSearchSystemPrompt');
      if (!response.ok) {
        throw new Error('Failed to load configuration');
      }

      const configuration = normalizeAiConfiguration(await readJsonOrFallback<unknown>(response, {}));
      setSelectedModel(configuration.geminiModelSelection);
      setSystemPrompt(configuration.aiPowerSearchSystemPrompt);
      await fetchAvailableModels();
    } catch (error) {
      console.error('Error loading configuration:', error);
      setError(getAiConfigurationErrorMessage(error, 'Failed to load configuration'));
      toast.error('Failed to load AI configuration');
    } finally {
      setIsLoading(false);
    }
  }, [fetchAvailableModels]);

  const saveConfiguration = useCallback(async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildAiConfigurationSettingsPayload({
          selectedModel,
          systemPrompt,
        })),
      });

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to save configuration'));
      }

      toast.success('AI configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError(getAiConfigurationErrorMessage(error, 'Failed to save configuration'));
      toast.error('Failed to save AI configuration');
    } finally {
      setIsSaving(false);
    }
  }, [selectedModel, systemPrompt]);

  useEffect(() => {
    void loadConfiguration();
  }, [loadConfiguration]);

  return {
    availableModels,
    currentModel: getCurrentAiModel(availableModels, selectedModel),
    error,
    fetchAvailableModels,
    isFetchingModels,
    isLoading,
    isSaving,
    saveConfiguration,
    selectedModel,
    setSelectedModel,
    setSystemPrompt,
    systemPrompt,
  };
}
