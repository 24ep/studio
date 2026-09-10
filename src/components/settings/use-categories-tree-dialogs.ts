"use client";

import { useState } from "react";

import type {
  Category,
  CategoryFormData,
  CategoryItem,
  CategoryItemFormData,
} from "./CategoriesTreeParts";
import { buildCategoryItemFormState } from "./categories-tree-utils";

export function useCategoriesTreeDialogs() {
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] =
    useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] =
    useState(false);
  const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedItem, setSelectedItem] = useState<CategoryItem | null>(null);
  const [categoryFormData, setCategoryFormData] =
    useState<CategoryFormData>({ name: "" });
  const [itemFormData, setItemFormData] = useState<CategoryItemFormData>(
    buildCategoryItemFormState(),
  );

  const openEditCategoryDialog = (category: Category) => {
    setSelectedCategory(category);
    setCategoryFormData({ name: category.name });
    setIsEditCategoryDialogOpen(true);
  };

  const openEditItemDialog = (item: CategoryItem) => {
    setSelectedItem(item);
    setItemFormData(buildCategoryItemFormState(item));
    setIsEditItemDialogOpen(true);
  };

  return {
    categoryFormData,
    isCreateCategoryDialogOpen,
    isCreateItemDialogOpen,
    isEditCategoryDialogOpen,
    isEditItemDialogOpen,
    itemFormData,
    openEditCategoryDialog,
    openEditItemDialog,
    selectedCategory,
    selectedItem,
    setCategoryFormData,
    setIsCreateCategoryDialogOpen,
    setIsCreateItemDialogOpen,
    setIsEditCategoryDialogOpen,
    setIsEditItemDialogOpen,
    setItemFormData,
    setSelectedCategory,
    setSelectedItem,
  };
}
