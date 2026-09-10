"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from '@/lib/response-json';
import {
  buildTreeItemRequestBody,
  createDefaultTreeItemFormData,
  getTreeCreateErrorMessage,
  type TreeItemFormData,
} from './tree-view-utils';
import { useTreeViewIconUpload } from './use-tree-view-icon-upload';

interface UseTreeViewCreateActionsOptions {
  categoriesEndpoint: string;
  categoryTitle: string;
  fetchData: () => void;
  isPersonalityTraits: boolean;
  itemsEndpoint: string;
  itemTitle: string;
}

export function useTreeViewCreateActions({
  categoriesEndpoint,
  categoryTitle,
  fetchData,
  isPersonalityTraits,
  itemsEndpoint,
  itemTitle,
}: UseTreeViewCreateActionsOptions) {
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
  const [showAdvancedConfigItem, setShowAdvancedConfigItem] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [itemFormData, setItemFormData] = useState<TreeItemFormData>(createDefaultTreeItemFormData());
  const {
    handleMainFileUpload,
    mainIconFile,
    mainIconPreview,
    removeMainIcon,
    resetMainIcon,
  } = useTreeViewIconUpload({ setItemFormData });

  const handleCreateCategory = async () => {
    try {
      const response = await fetch(categoriesEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryFormData.name }),
      });

      if (response.ok) {
        toast.success(`${categoryTitle} created successfully`);
        setCategoryFormData({ name: '' });
        setIsCreateCategoryDialogOpen(false);
        fetchData();
      } else {
        toast.error(getJsonErrorMessage(
          await readJsonObject(response),
          `Failed to create ${categoryTitle.toLowerCase()}`,
        ));
      }
    } catch (error) {
      console.error(`Error creating ${categoryTitle.toLowerCase()}:`, error);
      toast.error(`Failed to create ${categoryTitle.toLowerCase()}`);
    }
  };

  const handleCreateItem = async () => {
    if (!itemFormData.name || itemFormData.name.trim() === '') {
      toast.error(`${itemTitle} name is required`);
      return;
    }

    try {
      const requestBody = buildTreeItemRequestBody(itemFormData, isPersonalityTraits);

      const response = await fetch(itemsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success(`${itemTitle} created successfully`);
        setItemFormData(createDefaultTreeItemFormData());
        resetMainIcon();
        setIsCreateItemDialogOpen(false);
        fetchData();
      } else {
        const errorData = await readJsonOrFallback<{ message?: string; error?: string }>(
          response,
          { error: `Failed to create ${itemTitle.toLowerCase()}` },
        );
        const errorMessage = getTreeCreateErrorMessage(errorData, `Failed to create ${itemTitle.toLowerCase()}`);
        console.error(`Error creating ${itemTitle.toLowerCase()}:`, errorData);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(`Error creating ${itemTitle.toLowerCase()}:`, error);
      toast.error(`Failed to create ${itemTitle.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    categoryFormData,
    handleCreateCategory,
    handleCreateItem,
    handleMainFileUpload,
    isCreateCategoryDialogOpen,
    isCreateItemDialogOpen,
    itemFormData,
    mainIconFile,
    mainIconPreview,
    removeMainIcon,
    setCategoryFormData,
    setIsCreateCategoryDialogOpen,
    setIsCreateItemDialogOpen,
    setItemFormData,
    setShowAdvancedConfigItem,
    showAdvancedConfigItem,
  };
}
