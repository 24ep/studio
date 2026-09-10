import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { DEFAULT_AI_POWER_SEARCH_PROMPT } from './ai-power-search-default-prompt';
import {
  fetchAiPowerSearchPrompt,
  saveAiPowerSearchPrompt,
} from './ai-power-search-settings-api';

export function useAiPowerSearchPrompt() {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSavedPromptRef = useRef<string | null>(null);

  const loadCurrentPrompt = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const prompt = await fetchAiPowerSearchPrompt();
      lastSavedPromptRef.current = prompt;
      setCurrentPrompt(prompt);
    } catch (loadError) {
      console.error('Error fetching current prompt:', loadError);
      setError('Failed to load current system prompt');
      setCurrentPrompt(DEFAULT_AI_POWER_SEARCH_PROMPT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentPrompt();
  }, [loadCurrentPrompt]);

  useEffect(() => {
    if (
      isLoading ||
      lastSavedPromptRef.current === null ||
      currentPrompt === lastSavedPromptRef.current
    ) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsSaving(true);
        await saveAiPowerSearchPrompt(currentPrompt);
        lastSavedPromptRef.current = currentPrompt;
      } catch (saveError) {
        console.error('Error saving system prompt:', saveError);
        toast.error(saveError instanceof Error ? saveError.message : 'Failed to save system prompt');
      } finally {
        setIsSaving(false);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [currentPrompt, isLoading]);

  const handleReset = () => {
    if (!confirm('Are you sure you want to reset the system prompt to the default? This action cannot be undone.')) {
      return;
    }

    setCurrentPrompt(DEFAULT_AI_POWER_SEARCH_PROMPT);
    toast.success('System prompt reset to default');
  };

  const handleDone = () => {
    setIsEditing(false);
  };

  return {
    currentPrompt,
    error,
    handleDone,
    handleReset,
    isEditing,
    isLoading,
    isSaving,
    setCurrentPrompt,
    setIsEditing,
  };
}
