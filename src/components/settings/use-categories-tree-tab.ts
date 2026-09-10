"use client";

import { useCategoriesTreeData } from "./use-categories-tree-data";
import { useCategoriesTreeDialogs } from "./use-categories-tree-dialogs";
import { useCategoriesTreeMutations } from "./use-categories-tree-mutations";
import type { UseCategoriesTreeTabOptions } from "./categories-tree-tab-types";

export function useCategoriesTreeTab(options: UseCategoriesTreeTabOptions) {
  const data = useCategoriesTreeData(options);
  const dialogs = useCategoriesTreeDialogs();
  const mutations = useCategoriesTreeMutations({
    ...options,
    dialogs,
    fetchCategories: data.fetchCategories,
    fetchItems: data.fetchItems,
  });

  return {
    categories: data.categories,
    items: data.items,
    loading: data.loading,
    expandedCategories: data.expandedCategories,
    categoryTree: data.categoryTree,
    categoryFormData: dialogs.categoryFormData,
    setCategoryFormData: dialogs.setCategoryFormData,
    itemFormData: dialogs.itemFormData,
    setItemFormData: dialogs.setItemFormData,
    isCreateCategoryDialogOpen: dialogs.isCreateCategoryDialogOpen,
    setIsCreateCategoryDialogOpen: dialogs.setIsCreateCategoryDialogOpen,
    isEditCategoryDialogOpen: dialogs.isEditCategoryDialogOpen,
    setIsEditCategoryDialogOpen: dialogs.setIsEditCategoryDialogOpen,
    isCreateItemDialogOpen: dialogs.isCreateItemDialogOpen,
    setIsCreateItemDialogOpen: dialogs.setIsCreateItemDialogOpen,
    isEditItemDialogOpen: dialogs.isEditItemDialogOpen,
    setIsEditItemDialogOpen: dialogs.setIsEditItemDialogOpen,
    handleCreateCategory: mutations.handleCreateCategory,
    handleUpdateCategory: mutations.handleUpdateCategory,
    handleDeleteCategory: mutations.handleDeleteCategory,
    handleCreateItem: mutations.handleCreateItem,
    handleUpdateItem: mutations.handleUpdateItem,
    handleDeleteItem: mutations.handleDeleteItem,
    handleRemoveItemFromCategory: mutations.handleRemoveItemFromCategory,
    openEditCategoryDialog: dialogs.openEditCategoryDialog,
    openEditItemDialog: dialogs.openEditItemDialog,
    toggleCategoryExpansion: data.toggleCategoryExpansion,
    toggleAllCategories: data.toggleAllCategories,
  };
}
