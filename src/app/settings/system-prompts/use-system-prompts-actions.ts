"use client";

import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  getPromptSaveErrorMessage,
  readSystemPromptErrorMessage,
} from './system-prompts-page-utils';
import type {
  SystemPrompt,
  SystemPromptCategory,
  SystemPromptCategoryFormData,
  SystemPromptFormData,
} from './types';

interface UseSystemPromptsActionsOptions {
  categoryFormData: SystemPromptCategoryFormData;
  editingCategory: SystemPromptCategory | null;
  editingPrompt: SystemPrompt | null;
  fetchCategories: () => Promise<void>;
  fetchSystemPrompts: () => Promise<void>;
  promptFormData: SystemPromptFormData;
  resetCategoryForm: () => void;
  resetPromptForm: () => void;
  setIsCategoryModalOpen: (open: boolean) => void;
  setIsPromptModalOpen: (open: boolean) => void;
}

export function useSystemPromptsActions({
  categoryFormData,
  editingCategory,
  editingPrompt,
  fetchCategories,
  fetchSystemPrompts,
  promptFormData,
  resetCategoryForm,
  resetPromptForm,
  setIsCategoryModalOpen,
  setIsPromptModalOpen,
}: UseSystemPromptsActionsOptions) {
  const [isImportingAppKit, setIsImportingAppKit] = useState<{
    environment: "development" | "production";
    percent: number;
    message: string;
  } | null>(null);

  const handleLoadFromAppKit = useCallback(async (environment: 'development' | 'production') => {
    try {
      setIsImportingAppKit({ environment, percent: 10, message: "Initializing AppKit request" });
      const response = await fetch('/api/settings/system-prompts/import-appkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ environment }),
      });
      setIsImportingAppKit((current) => current ? { ...current, percent: 40, message: "Fetching prompt catalog" } : null);

      if (!response.ok) {
        toast.error(
          await readSystemPromptErrorMessage(
            response,
            'Failed to load common prompts from AppKit',
          ),
        );
        return;
      }

      setIsImportingAppKit((current) => current ? { ...current, percent: 80, message: "Applying imported prompts" } : null);
      toast.success(`Loaded common AI prompts from AppKit ${environment}`);
      await fetchCategories();
      await fetchSystemPrompts();
    } catch (error) {
      console.error('Error loading common prompts from AppKit:', error);
      toast.error('Failed to load common prompts from AppKit');
    } finally {
      setIsImportingAppKit(null);
    }
  }, [fetchCategories, fetchSystemPrompts]);

  const handleSavePrompt = useCallback(async () => {
    try {
      const url = editingPrompt
        ? `/api/settings/system-prompts/${editingPrompt.id}`
        : '/api/settings/system-prompts';
      const response = await fetch(url, {
        method: editingPrompt ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(promptFormData),
      });

      if (response.ok) {
        toast.success(
          editingPrompt
            ? 'System prompt updated successfully'
            : 'System prompt created successfully',
        );
        setIsPromptModalOpen(false);
        resetPromptForm();
        fetchSystemPrompts();
        return;
      }

      const message = await readSystemPromptErrorMessage(
        response,
        'Failed to save system prompt',
      );
      toast.error(getPromptSaveErrorMessage(message));
    } catch (error) {
      console.error('Error saving system prompt:', error);
      toast.error('Failed to save system prompt');
    }
  }, [
    editingPrompt,
    fetchSystemPrompts,
    promptFormData,
    resetPromptForm,
    setIsPromptModalOpen,
  ]);

  const handleDeletePrompt = useCallback(
    async (id: string) => {
      if (!confirm('Are you sure you want to delete this system prompt?')) {
        return;
      }

      try {
        const response = await fetch(`/api/settings/system-prompts/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          toast.success('System prompt deleted successfully');
          fetchSystemPrompts();
        } else {
          toast.error('Failed to delete system prompt');
        }
      } catch (error) {
        console.error('Error deleting system prompt:', error);
        toast.error('Failed to delete system prompt');
      }
    },
    [fetchSystemPrompts],
  );

  const handleSaveCategory = useCallback(async () => {
    try {
      const url = editingCategory
        ? `/api/settings/system-prompt-categories/${editingCategory.id}`
        : '/api/settings/system-prompt-categories';
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(categoryFormData),
      });

      if (response.ok) {
        toast.success(
          editingCategory
            ? 'Category updated successfully'
            : 'Category created successfully',
        );
        setIsCategoryModalOpen(false);
        resetCategoryForm();
        fetchCategories();
        return;
      }

      toast.error(
        await readSystemPromptErrorMessage(
          response,
          'Failed to save category',
        ),
      );
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  }, [
    categoryFormData,
    editingCategory,
    fetchCategories,
    resetCategoryForm,
    setIsCategoryModalOpen,
  ]);

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      if (!confirm('Are you sure you want to delete this category?')) {
        return;
      }

      try {
        const response = await fetch(
          `/api/settings/system-prompt-categories/${id}`,
          {
            method: 'DELETE',
            credentials: 'include',
          },
        );

        if (response.ok) {
          toast.success('Category deleted successfully');
          fetchCategories();
          return;
        }

        toast.error(
          await readSystemPromptErrorMessage(
            response,
            'Failed to delete category',
          ),
        );
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Failed to delete category');
      }
    },
    [fetchCategories],
  );

  return {
    handleDeleteCategory,
    handleDeletePrompt,
    handleLoadFromAppKit,
    handleSaveCategory,
    handleSavePrompt,
    isImportingAppKit,
  };
}
