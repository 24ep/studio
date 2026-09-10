"use client";

import { useSystemPromptsActions } from './use-system-prompts-actions';
import { useSystemPromptsData } from './use-system-prompts-data';
import { useSystemPromptsUiState } from './use-system-prompts-ui-state';

export function useSystemPromptsPage() {
  const data = useSystemPromptsData();
  const ui = useSystemPromptsUiState({
    categories: data.categories,
    systemPrompts: data.systemPrompts,
  });
  const actions = useSystemPromptsActions({
    categoryFormData: ui.categoryFormData,
    editingCategory: ui.editingCategory,
    editingPrompt: ui.editingPrompt,
    fetchCategories: data.fetchCategories,
    fetchSystemPrompts: data.fetchSystemPrompts,
    promptFormData: ui.promptFormData,
    resetCategoryForm: ui.resetCategoryForm,
    resetPromptForm: ui.resetPromptForm,
    setIsCategoryModalOpen: ui.setIsCategoryModalOpen,
    setIsPromptModalOpen: ui.setIsPromptModalOpen,
  });

  return {
    activeTab: ui.activeTab,
    categories: data.categories,
    categoryFormData: ui.categoryFormData,
    categorySearchTerm: ui.categorySearchTerm,
    editingCategory: ui.editingCategory,
    editingPrompt: ui.editingPrompt,
    filteredCategories: ui.filteredCategories,
    filteredPrompts: ui.filteredPrompts,
    handleDeleteCategory: actions.handleDeleteCategory,
    handleDeletePrompt: actions.handleDeletePrompt,
    handleLoadFromAppKit: actions.handleLoadFromAppKit,
    handleSaveCategory: actions.handleSaveCategory,
    handleSavePrompt: actions.handleSavePrompt,
    isImportingAppKit: actions.isImportingAppKit,
    isCategoryModalOpen: ui.isCategoryModalOpen,
    isLoading: data.isLoading,
    isPromptModalOpen: ui.isPromptModalOpen,
    openCreateCategoryModal: ui.openCreateCategoryModal,
    openCreatePromptModal: ui.openCreatePromptModal,
    openEditCategoryModal: ui.openEditCategoryModal,
    openEditPromptModal: ui.openEditPromptModal,
    promptFormData: ui.promptFormData,
    searchTerm: ui.searchTerm,
    selectedCategory: ui.selectedCategory,
    sessionStatus: data.sessionStatus,
    setActiveTab: ui.setActiveTab,
    setCategoryFormData: ui.setCategoryFormData,
    setCategorySearchTerm: ui.setCategorySearchTerm,
    setIsCategoryModalOpen: ui.setIsCategoryModalOpen,
    setIsPromptModalOpen: ui.setIsPromptModalOpen,
    setPromptFormData: ui.setPromptFormData,
    setSearchTerm: ui.setSearchTerm,
    setSelectedCategory: ui.setSelectedCategory,
    showLogoOnly: data.showLogoOnly,
  };
}
