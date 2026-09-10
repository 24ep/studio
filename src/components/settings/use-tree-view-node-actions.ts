"use client";

import type { TreeNodeData } from "./tree-view-utils";
import type { TreeCategoryOption } from "./TreeCategorySelect";
import { useTreeViewNodeDialogState } from "./use-tree-view-node-dialog-state";
import { useTreeViewNodeMutations } from "./use-tree-view-node-mutations";

interface UseTreeViewNodeActionsOptions {
  node: TreeNodeData;
  itemTitle: string;
  categories: TreeCategoryOption[];
  itemsEndpoint?: string;
  isPersonalityTraits: boolean;
  onRefresh?: () => void;
}

export function useTreeViewNodeActions({
  node,
  itemTitle,
  categories,
  itemsEndpoint,
  isPersonalityTraits,
  onRefresh,
}: UseTreeViewNodeActionsOptions) {
  const dialogState = useTreeViewNodeDialogState({ node, categories });
  const mutations = useTreeViewNodeMutations({
    formData: dialogState.formData,
    isPersonalityTraits,
    itemId: node.id,
    itemTitle,
    itemsEndpoint,
    onCloseCreateDialog: () => dialogState.setIsCreateDialogOpen(false),
    onCloseDeleteDialog: () => dialogState.setIsDeleteDialogOpen(false),
    onCloseEditDialog: () => dialogState.setIsEditDialogOpen(false),
    onCloseRemoveFromGroupDialog: () => dialogState.setIsRemoveFromGroupDialogOpen(false),
    onRefresh,
    onResetCreateForm: dialogState.resetCreateForm,
  });

  return {
    ...dialogState,
    ...mutations,
  };
}
