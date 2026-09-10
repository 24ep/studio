"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { toast } from "react-hot-toast";

import {
  createDefaultTreeItemFormData,
  createTreeItemFormDataFromNode,
  getTreeIconFileValidationError,
  type TreeItemFormData,
  type TreeNodeData,
} from "./tree-view-utils";
import type { TreeCategoryOption } from "./TreeCategorySelect";

interface UseTreeViewNodeDialogStateOptions {
  node: TreeNodeData;
  categories: TreeCategoryOption[];
}

export function resetTreeNodeIconState(
  setIconFile: (file: File | null) => void,
  setIconPreview: (preview: string | null) => void,
  preview: string | null = null,
) {
  setIconFile(null);
  setIconPreview(preview);
}

export function useTreeViewNodeDialogState({
  node,
  categories,
}: UseTreeViewNodeDialogStateOptions) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRemoveFromGroupDialogOpen, setIsRemoveFromGroupDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TreeItemFormData>(createDefaultTreeItemFormData());
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  const openEditDialog = useCallback(() => {
    setFormData(createTreeItemFormDataFromNode(node));
    resetTreeNodeIconState(setIconFile, setIconPreview, node.iconUrl || null);
    setIsEditDialogOpen(true);
  }, [node]);

  const openCreateChildDialog = useCallback(() => {
    const isValidCategory = categories.some((category) => category.id === node.id);
    setFormData(createDefaultTreeItemFormData(isValidCategory ? node.id : "none"));
    resetTreeNodeIconState(setIconFile, setIconPreview);
    setIsCreateDialogOpen(true);
  }, [categories, node.id]);

  const handleFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = getTreeIconFileValidationError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  }, []);

  const removeIcon = useCallback(() => {
    if (iconPreview) {
      URL.revokeObjectURL(iconPreview);
    }

    setIconFile(null);
    setIconPreview(null);
    setFormData((prev) => ({ ...prev, iconUrl: "" }));
  }, [iconPreview]);

  const resetCreateForm = useCallback(() => {
    setFormData(createDefaultTreeItemFormData());
    resetTreeNodeIconState(setIconFile, setIconPreview);
  }, []);

  return {
    formData,
    setFormData,
    iconFile,
    iconPreview,
    showAdvancedConfig,
    setShowAdvancedConfig,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isRemoveFromGroupDialogOpen,
    setIsRemoveFromGroupDialogOpen,
    openEditDialog,
    openCreateChildDialog,
    handleFileUpload,
    removeIcon,
    resetCreateForm,
  };
}
