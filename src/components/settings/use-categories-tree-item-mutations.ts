"use client";

import { useCallback } from "react";

import { runCategoryTreeMutationWithFeedback } from "./categories-tree-mutation-feedback";
import { getLowerCategoryTreeTitle } from "./categories-tree-tab-api";
import { buildCategoryItemFormState, buildCategoryItemPayload } from "./categories-tree-utils";
import type { CategoriesTreeMutationOptions } from "./categories-tree-mutation-types";

export function useCategoriesTreeItemMutations({
  itemTitle,
  itemsEndpoint,
  dialogs,
  fetchItems,
}: CategoriesTreeMutationOptions) {
  const lowerItemTitle = getLowerCategoryTreeTitle(itemTitle);

  const resetItemForm = useCallback(() => {
    dialogs.setItemFormData(buildCategoryItemFormState());
  }, [dialogs]);

  const resetSelectedItem = useCallback(() => {
    dialogs.setSelectedItem(null);
    resetItemForm();
  }, [dialogs, resetItemForm]);

  const handleCreateItem = useCallback(async () => {
    await runCategoryTreeMutationWithFeedback({
      consoleMessage: `Error creating ${lowerItemTitle}:`,
      failureMessage: `Failed to create ${lowerItemTitle}`,
      mutation: {
        body: buildCategoryItemPayload(dialogs.itemFormData),
        fallbackMessage: `Failed to create ${lowerItemTitle}`,
        method: "POST",
        url: itemsEndpoint,
      },
      onSuccess: () => {
        dialogs.setIsCreateItemDialogOpen(false);
        resetItemForm();
        fetchItems();
      },
      successMessage: `${itemTitle} created successfully`,
    });
  }, [
    dialogs,
    fetchItems,
    itemTitle,
    itemsEndpoint,
    lowerItemTitle,
    resetItemForm,
  ]);

  const handleUpdateItem = useCallback(async () => {
    if (!dialogs.selectedItem) {
      return;
    }

    await runCategoryTreeMutationWithFeedback({
      consoleMessage: `Error updating ${lowerItemTitle}:`,
      failureMessage: `Failed to update ${lowerItemTitle}`,
      mutation: {
        body: buildCategoryItemPayload(dialogs.itemFormData),
        fallbackMessage: `Failed to update ${lowerItemTitle}`,
        method: "PUT",
        url: `${itemsEndpoint}/${dialogs.selectedItem.id}`,
      },
      onSuccess: () => {
        dialogs.setIsEditItemDialogOpen(false);
        resetSelectedItem();
        fetchItems();
      },
      successMessage: `${itemTitle} updated successfully`,
    });
  }, [
    dialogs,
    fetchItems,
    itemTitle,
    itemsEndpoint,
    lowerItemTitle,
    resetSelectedItem,
  ]);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!confirm(`Are you sure you want to delete this ${lowerItemTitle}?`)) {
        return;
      }

      await runCategoryTreeMutationWithFeedback({
        consoleMessage: `Error deleting ${lowerItemTitle}:`,
        failureMessage: `Failed to delete ${lowerItemTitle}`,
        mutation: {
          fallbackMessage: `Failed to delete ${lowerItemTitle}`,
          method: "DELETE",
          url: `${itemsEndpoint}/${itemId}`,
        },
        onSuccess: () => {
          fetchItems();
        },
        successMessage: `${itemTitle} deleted successfully`,
      });
    },
    [fetchItems, itemTitle, itemsEndpoint, lowerItemTitle],
  );

  const handleRemoveItemFromCategory = useCallback(
    async (itemId: string) => {
      await runCategoryTreeMutationWithFeedback({
        consoleMessage: `Error removing ${lowerItemTitle} from category:`,
        failureMessage: `Failed to remove ${lowerItemTitle} from category`,
        mutation: {
          body: {
            categoryId: null,
            groupId: null,
          },
          fallbackMessage: `Failed to remove ${lowerItemTitle} from category`,
          method: "PUT",
          url: `${itemsEndpoint}/${itemId}`,
        },
        onSuccess: () => {
          fetchItems();
        },
        successMessage: `${itemTitle} removed from category successfully`,
      });
    },
    [fetchItems, itemTitle, itemsEndpoint, lowerItemTitle],
  );

  return {
    handleCreateItem,
    handleDeleteItem,
    handleRemoveItemFromCategory,
    handleUpdateItem,
  };
}
