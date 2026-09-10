"use client";

import { useMemo, useState } from 'react';

import type {
  SystemPrompt,
  SystemPromptCategory,
  SystemPromptCategoryFormData,
  SystemPromptFormData,
} from './types';
import {
  buildCategoryFormData,
  buildPromptFormData,
  DEFAULT_CATEGORY_FORM_DATA,
  DEFAULT_PROMPT_FORM_DATA,
  filterSystemPromptCategories,
  filterSystemPrompts,
} from './system-prompts-page-utils';

export function useSystemPromptsUiState({
  categories,
  systemPrompts,
}: {
  categories: SystemPromptCategory[];
  systemPrompts: SystemPrompt[];
}) {
  const [activeTab, setActiveTab] = useState('prompts');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [promptFormData, setPromptFormData] = useState<SystemPromptFormData>(
    DEFAULT_PROMPT_FORM_DATA,
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<SystemPromptCategory | null>(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [categoryFormData, setCategoryFormData] =
    useState<SystemPromptCategoryFormData>(DEFAULT_CATEGORY_FORM_DATA);

  const filteredPrompts = useMemo(
    () =>
      filterSystemPrompts({
        prompts: systemPrompts,
        searchTerm,
        selectedCategory,
      }),
    [searchTerm, selectedCategory, systemPrompts],
  );

  const filteredCategories = useMemo(
    () =>
      filterSystemPromptCategories({
        categories,
        searchTerm: categorySearchTerm,
      }),
    [categories, categorySearchTerm],
  );

  const resetPromptForm = () => setPromptFormData(DEFAULT_PROMPT_FORM_DATA);
  const resetCategoryForm = () =>
    setCategoryFormData(DEFAULT_CATEGORY_FORM_DATA);

  const openEditPromptModal = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setPromptFormData(buildPromptFormData(prompt));
    setIsPromptModalOpen(true);
  };

  const openCreatePromptModal = () => {
    setEditingPrompt(null);
    resetPromptForm();
    setIsPromptModalOpen(true);
  };

  const openEditCategoryModal = (category: SystemPromptCategory) => {
    setEditingCategory(category);
    setCategoryFormData(buildCategoryFormData(category));
    setIsCategoryModalOpen(true);
  };

  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    resetCategoryForm();
    setIsCategoryModalOpen(true);
  };

  return {
    activeTab,
    categoryFormData,
    categorySearchTerm,
    editingCategory,
    editingPrompt,
    filteredCategories,
    filteredPrompts,
    isCategoryModalOpen,
    isPromptModalOpen,
    openCreateCategoryModal,
    openCreatePromptModal,
    openEditCategoryModal,
    openEditPromptModal,
    promptFormData,
    resetCategoryForm,
    resetPromptForm,
    searchTerm,
    selectedCategory,
    setActiveTab,
    setCategoryFormData,
    setCategorySearchTerm,
    setEditingCategory,
    setEditingPrompt,
    setIsCategoryModalOpen,
    setIsPromptModalOpen,
    setPromptFormData,
    setSearchTerm,
    setSelectedCategory,
  };
}
