"use client";

import type { ChangeEvent } from "react";
import type { TreeCategoryOption } from "./TreeCategorySelect";
import {
  ConfirmationDialog,
  TreeNodeCreateDialog,
  TreeNodeDeleteDialog,
  TreeNodeEditDialog,
} from "./TreeViewNodeDialogParts";
import type { TreeItemFormData, TreeNodeData } from "./tree-view-utils";

interface TreeNodeDialogsProps {
  node: TreeNodeData;
  itemTitle: string;
  categoryTitle: string;
  categories: TreeCategoryOption[];
  isFolder: boolean;
  isPersonalityTraits: boolean;
  formData: TreeItemFormData;
  showAdvancedConfig: boolean;
  iconFile: File | null;
  iconPreview: string | null;
  isCreateDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isRemoveFromGroupDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  setFormData: (formData: TreeItemFormData) => void;
  setShowAdvancedConfig: (open: boolean) => void;
  setIsCreateDialogOpen: (open: boolean) => void;
  setIsEditDialogOpen: (open: boolean) => void;
  setIsRemoveFromGroupDialogOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveIcon: () => void;
  onCreateChildItem: () => void;
  onUpdateItem: () => void;
  onRemoveFromGroup: () => void;
  onPermanentDelete: () => void;
}

export function TreeNodeDialogs({
  node,
  itemTitle,
  categoryTitle,
  categories,
  isFolder,
  isPersonalityTraits,
  formData,
  showAdvancedConfig,
  iconFile,
  iconPreview,
  isCreateDialogOpen,
  isEditDialogOpen,
  isRemoveFromGroupDialogOpen,
  isDeleteDialogOpen,
  setFormData,
  setShowAdvancedConfig,
  setIsCreateDialogOpen,
  setIsEditDialogOpen,
  setIsRemoveFromGroupDialogOpen,
  setIsDeleteDialogOpen,
  onFileUpload,
  onRemoveIcon,
  onCreateChildItem,
  onUpdateItem,
  onRemoveFromGroup,
  onPermanentDelete,
}: TreeNodeDialogsProps) {
  return (
    <>
      <TreeNodeCreateDialog
        open={isCreateDialogOpen}
        itemTitle={itemTitle}
        categories={categories}
        formData={formData}
        isPersonalityTraits={isPersonalityTraits}
        showAdvancedConfig={showAdvancedConfig}
        iconFile={iconFile}
        iconPreview={iconPreview}
        onOpenChange={setIsCreateDialogOpen}
        onFormDataChange={setFormData}
        onAdvancedConfigOpenChange={setShowAdvancedConfig}
        onFileUpload={onFileUpload}
        onRemoveIcon={onRemoveIcon}
        onSubmit={onCreateChildItem}
      />
      <TreeNodeEditDialog
        open={isEditDialogOpen}
        itemTitle={itemTitle}
        categoryTitle={categoryTitle}
        categories={categories}
        isFolder={isFolder}
        isPersonalityTraits={isPersonalityTraits}
        formData={formData}
        showAdvancedConfig={showAdvancedConfig}
        iconFile={iconFile}
        iconPreview={iconPreview}
        onOpenChange={setIsEditDialogOpen}
        onFormDataChange={setFormData}
        onAdvancedConfigOpenChange={setShowAdvancedConfig}
        onFileUpload={onFileUpload}
        onRemoveIcon={onRemoveIcon}
        onSubmit={onUpdateItem}
      />
      <ConfirmationDialog
        open={isRemoveFromGroupDialogOpen}
        title="Remove from Group"
        description={`Remove "${node.name}" from this group? The skill will be moved to the root level and can be reassigned later.`}
        submitLabel="Remove from Group"
        onOpenChange={setIsRemoveFromGroupDialogOpen}
        onSubmit={onRemoveFromGroup}
      />
      <TreeNodeDeleteDialog
        open={isDeleteDialogOpen}
        nodeName={node.name}
        onOpenChange={setIsDeleteDialogOpen}
        onSubmit={onPermanentDelete}
      />
    </>
  );
}
