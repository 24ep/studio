"use client";

import { useCallback } from "react";
import { toast } from "react-hot-toast";

import {
  buildTreeItemRequestBody,
  type TreeItemFormData,
} from "./tree-view-utils";
import {
  runTreeNodeJsonMutation,
  runTreeNodeSimpleMutation,
} from "./tree-view-node-action-api";

interface UseTreeViewNodeMutationsOptions {
  formData: TreeItemFormData;
  isPersonalityTraits: boolean;
  itemId: string;
  itemTitle: string;
  itemsEndpoint?: string;
  onCloseCreateDialog: () => void;
  onCloseDeleteDialog: () => void;
  onCloseEditDialog: () => void;
  onCloseRemoveFromGroupDialog: () => void;
  onRefresh?: () => void;
  onResetCreateForm: () => void;
}

export function useTreeViewNodeMutations({
  formData,
  isPersonalityTraits,
  itemId,
  itemTitle,
  itemsEndpoint,
  onCloseCreateDialog,
  onCloseDeleteDialog,
  onCloseEditDialog,
  onCloseRemoveFromGroupDialog,
  onRefresh,
  onResetCreateForm,
}: UseTreeViewNodeMutationsOptions) {
  const lowerItemTitle = itemTitle.toLowerCase();

  const validateName = useCallback(() => {
    if (formData.name.trim()) {
      return true;
    }

    toast.error(`${itemTitle} name is required`);
    return false;
  }, [formData.name, itemTitle]);

  const handleCreateChildItem = useCallback(async () => {
    if (!itemsEndpoint || !validateName()) return;

    try {
      const result = await runTreeNodeJsonMutation({
        url: itemsEndpoint,
        method: "POST",
        body: buildTreeItemRequestBody(formData, isPersonalityTraits),
        fallbackMessage: `Failed to create ${lowerItemTitle}`,
      });

      if (result.ok) {
        toast.success(`${itemTitle} created successfully`);
        onCloseCreateDialog();
        onResetCreateForm();
        onRefresh?.();
        return;
      }

      console.error(`Error creating ${lowerItemTitle}:`, result.errorData);
      toast.error(result.message);
    } catch (error) {
      console.error(`Error creating ${lowerItemTitle}:`, error);
      toast.error(`Failed to create ${lowerItemTitle}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [
    formData,
    isPersonalityTraits,
    itemTitle,
    itemsEndpoint,
    lowerItemTitle,
    onCloseCreateDialog,
    onRefresh,
    onResetCreateForm,
    validateName,
  ]);

  const handleUpdateItem = useCallback(async () => {
    if (!itemsEndpoint || !validateName()) return;

    try {
      const result = await runTreeNodeJsonMutation({
        url: `${itemsEndpoint}/${itemId}`,
        method: "PUT",
        body: buildTreeItemRequestBody(formData, isPersonalityTraits),
        fallbackMessage: `Failed to update ${lowerItemTitle}`,
      });

      if (result.ok) {
        toast.success(`${itemTitle} updated successfully`);
        onCloseEditDialog();
        onRefresh?.();
        return;
      }

      console.error(`Error updating ${lowerItemTitle}:`, result.errorData);
      toast.error(result.message);
    } catch (error) {
      console.error(`Error updating ${lowerItemTitle}:`, error);
      toast.error(`Failed to update ${lowerItemTitle}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [
    formData,
    isPersonalityTraits,
    itemId,
    itemTitle,
    itemsEndpoint,
    lowerItemTitle,
    onCloseEditDialog,
    onRefresh,
    validateName,
  ]);

  const handleRemoveFromGroup = useCallback(async () => {
    if (!itemsEndpoint) {
      toast.error("Cannot remove from group: no endpoint configured");
      return;
    }

    try {
      const result = await runTreeNodeSimpleMutation({
        url: `${itemsEndpoint}/${itemId}`,
        method: "PUT",
        body: { groupId: null },
        fallbackMessage: `Failed to remove ${lowerItemTitle} from group`,
      });

      if (result.ok) {
        toast.success(`${itemTitle} removed from group`);
        onCloseRemoveFromGroupDialog();
        onRefresh?.();
        return;
      }

      toast.error(result.message);
    } catch (error) {
      console.error("Error removing from group:", error);
      toast.error(`Failed to remove ${lowerItemTitle} from group`);
    }
  }, [
    itemId,
    itemTitle,
    itemsEndpoint,
    lowerItemTitle,
    onCloseRemoveFromGroupDialog,
    onRefresh,
  ]);

  const handlePermanentDelete = useCallback(async () => {
    if (!itemsEndpoint) {
      toast.error("Cannot delete: no endpoint configured");
      return;
    }

    try {
      const result = await runTreeNodeSimpleMutation({
        url: `${itemsEndpoint}/${itemId}`,
        method: "DELETE",
        fallbackMessage: `Failed to delete ${lowerItemTitle}`,
      });

      if (result.ok) {
        toast.success(`${itemTitle} deleted permanently`);
        onCloseDeleteDialog();
        onRefresh?.();
        return;
      }

      toast.error(result.message);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(`Failed to delete ${lowerItemTitle}`);
    }
  }, [
    itemId,
    itemTitle,
    itemsEndpoint,
    lowerItemTitle,
    onCloseDeleteDialog,
    onRefresh,
  ]);

  return {
    handleCreateChildItem,
    handleUpdateItem,
    handleRemoveFromGroup,
    handlePermanentDelete,
  };
}
