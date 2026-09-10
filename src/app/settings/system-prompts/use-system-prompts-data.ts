"use client";

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

import { getJsonString, readJsonObject, readJsonOrFallback } from '../../../lib/response-json';
import type { SystemPrompt, SystemPromptCategory } from './types';
import {
  readSystemPromptErrorMessage,
  shouldShowMissingCategoriesToast,
} from './system-prompts-page-utils';

export function useSystemPromptsData() {
  const { status: sessionStatus } = useSession();
  const [showLogoOnly, setShowLogoOnly] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [categories, setCategories] = useState<SystemPromptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/system-prompt-categories', {
        credentials: 'include',
      });

      if (response.ok) {
        setCategories(await readJsonOrFallback<SystemPromptCategory[]>(response, []));
        return;
      }

      const message = await readSystemPromptErrorMessage(
        response,
        'Failed to fetch categories',
      );
      console.error('Failed to fetch categories:', message);
      if (shouldShowMissingCategoriesToast(message)) {
        toast.error(
          'No system prompt categories exist. Please create at least one category first.',
        );
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchSystemPrompts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/system-prompts', {
        credentials: 'include',
      });

      if (response.ok) {
        setSystemPrompts(await readJsonOrFallback<SystemPrompt[]>(response, []));
      } else {
        toast.error('Failed to fetch system prompts');
      }
    } catch (error) {
      console.error('Error fetching system prompts:', error);
      toast.error('Failed to fetch system prompts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchSystemPrompts();
      fetchCategories();
    }
  }, [fetchCategories, fetchSystemPrompts, sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') {
      return;
    }

    const fetchShowLogoOnly = async () => {
      try {
        const response = await fetch('/api/settings/system-settings?keys=showLogoOnly');
        if (response.ok) {
          const data = await readJsonObject(response);
          setShowLogoOnly(
            getJsonString(data, 'showLogoOnly') === 'true' || data.showLogoOnly === true,
          );
        }
      } catch (error) {
        console.error('Error fetching showLogoOnly setting:', error);
      }
    };

    fetchShowLogoOnly();
  }, [sessionStatus]);

  return {
    categories,
    fetchCategories,
    fetchSystemPrompts,
    isLoading,
    sessionStatus,
    showLogoOnly,
    systemPrompts,
  };
}
