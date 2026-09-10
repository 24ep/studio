"use client";

import { useCallback } from "react";

import { runCategoryTreeMutationWithFeedback } from "./categories-tree-mutation-feedback";
import { getLowerCategoryTreeTitle } from "./categories-tree-tab-api";
import type { CategoriesTreeMutationOptions } from "./categories-tree-mutation-types";

export function useCategoriesTreeCategoryMutations({
  categoryTitle,
  itemTitle,
  categoriesEndpoint,
  dialogs,
  fetchCategories,
  fetchItems,
}: CategoriesTreeMutationOptions) {
  const lowerCategoryTitle = getLowerCategoryTreeTitle(categoryTitle);
  const lowerItemTitle = getLowerCategoryTreeTitle(itemTitle);

  const resetCategoryForm = useCallback(() => {
    dialogs.setCategoryFormData({ name: "" });
  }, [dialogs]);

  const resetSelectedCategory = useCallback(() => {
    dialogs.setSelectedCategory(null);
    resetCategoryForm();
  }, [dialogs, resetCategoryForm]);

  const handleCreateCategory = useCallback(async () => {
    await runCategoryTreeMutationWithFeedback({
      consoleMessage: `Error creating ${lowerCategoryTitle}:`,
      failureMessage: `Failed to create ${lowerCategoryTitle}`,
      mutation: {
        body: dialogs.categoryFormData,
        fallbackMessage: `Failed to create ${lowerCategoryTitle}`,
        method: "POST",
        url: categoriesEndpoint,
      },
      onSuccess: () => {
        dialogs.setIsCreateCategoryDialogOpen(false);
        resetCategoryForm();
        fetchCategories();
      },
      successMessage: `${categoryTitle} created successfully`,
    });
  }, [
    categoriesEndpoint,
    categoryTitle,
    dialogs,
    fetchCategories,
    lowerCategoryTitle,
    resetCategoryForm,
  ]);

  const handleUpdateCategory = useCallback(async () => {
    if (!dialogs.selectedCategory) {
      return;
    }

    await runCategoryTreeMutationWithFeedback({
      consoleMessage: `Error updating ${lowerCategoryTitle}:`,
      failureMessage: `Failed to update ${lowerCategoryTitle}`,
      mutation: {
        body: dialogs.categoryFormData,
        fallbackMessage: `Failed to update ${lowerCategoryTitle}`,
        method: "PUT",
        url: `${categoriesEndpoint}/${dialogs.selectedCategory.id}`,
      },
      onSuccess: () => {
        dialogs.setIsEditCategoryDialogOpen(false);
        resetSelectedCategory();
        fetchCategories();
      },
      successMessage: `${categoryTitle} updated successfully`,
    });
  }, [
    categoriesEndpoint,
    categoryTitle,
    dialogs,
    fetchCategories,
    lowerCategoryTitle,
    resetSelectedCategory,
  ]);

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      const confirmed = confirm(
        `Are you sure you want to delete this ${lowerCategoryTitle}? This will also remove all associated ${lowerItemTitle}.`,
      );
      if (!confirmed) {
        return;
      }

      await runCategoryTreeMutationWithFeedback({
        consoleMessage: `Error deleting ${lowerCategoryTitle}:`,
        failureMessage: `Failed to delete ${lowerCategoryTitle}`,
        mutation: {
          fallbackMessage: `Failed to delete ${lowerCategoryTitle}`,
          method: "DELETE",
          url: `${categoriesEndpoint}/${categoryId}`,
        },
        onSuccess: () => {
          fetchCategories();
          fetchItems();
        },
        successMessage: `${categoryTitle} deleted successfully`,
      });
    },
    [
      categoriesEndpoint,
      categoryTitle,
      fetchCategories,
      fetchItems,
      lowerCategoryTitle,
      lowerItemTitle,
    ],
  );

  return {
    handleCreateCategory,
    handleDeleteCategory,
    handleUpdateCategory,
  };
}
