"use client";

import { useDynamicZIndex } from "@/contexts/ZIndexContext";

import { CategoryDialog, CategoryItemDialog } from "./CategoriesTreeDialogs";
import { CategoriesTreePanel, CategoriesTreeTabHeader } from "./CategoriesTreeTabView";
import { useCategoriesTreeTab } from "./use-categories-tree-tab";

interface CategoriesTreeTabProps {
  title: string;
  categoryTitle: string;
  itemTitle: string;
  categoriesEndpoint: string;
  itemsEndpoint: string;
}

export default function CategoriesTreeTab({
  title,
  categoryTitle,
  itemTitle,
  categoriesEndpoint,
  itemsEndpoint,
}: CategoriesTreeTabProps) {
  const { contentZIndex: modalZIndex } = useDynamicZIndex("categories-tree-modals", "modal");
  const tab = useCategoriesTreeTab({
    categoryTitle,
    itemTitle,
    categoriesEndpoint,
    itemsEndpoint,
  });

  if (tab.loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <CategoriesTreeTabHeader
        title={title}
        itemTitle={itemTitle}
        onCreateCategory={() => tab.setIsCreateCategoryDialogOpen(true)}
      />

      <div className="space-y-4">
        <CategoriesTreePanel
          categoryTitle={categoryTitle}
          itemTitle={itemTitle}
          categories={tab.categories}
          items={tab.items}
          categoryTree={tab.categoryTree}
          expandedCategories={tab.expandedCategories}
          modalZIndex={modalZIndex}
          onToggleAllCategories={tab.toggleAllCategories}
          onCreateItem={() => tab.setIsCreateItemDialogOpen(true)}
          onToggleCategory={tab.toggleCategoryExpansion}
          onEditCategory={tab.openEditCategoryDialog}
          onDeleteCategory={tab.handleDeleteCategory}
          onEditItem={tab.openEditItemDialog}
          onDeleteItem={tab.handleDeleteItem}
          onRemoveItemFromCategory={tab.handleRemoveItemFromCategory}
        />
      </div>

      <CategoryDialog
        open={tab.isCreateCategoryDialogOpen}
        mode="create"
        categoryTitle={categoryTitle}
        itemTitle={itemTitle}
        formData={tab.categoryFormData}
        onOpenChange={tab.setIsCreateCategoryDialogOpen}
        onFormDataChange={tab.setCategoryFormData}
        onSubmit={tab.handleCreateCategory}
      />
      <CategoryDialog
        open={tab.isEditCategoryDialogOpen}
        mode="edit"
        categoryTitle={categoryTitle}
        itemTitle={itemTitle}
        formData={tab.categoryFormData}
        onOpenChange={tab.setIsEditCategoryDialogOpen}
        onFormDataChange={tab.setCategoryFormData}
        onSubmit={tab.handleUpdateCategory}
      />
      <CategoryItemDialog
        open={tab.isCreateItemDialogOpen}
        mode="create"
        itemTitle={itemTitle}
        categories={tab.categories}
        formData={tab.itemFormData}
        onOpenChange={tab.setIsCreateItemDialogOpen}
        onFormDataChange={tab.setItemFormData}
        onSubmit={tab.handleCreateItem}
      />
      <CategoryItemDialog
        open={tab.isEditItemDialogOpen}
        mode="edit"
        itemTitle={itemTitle}
        categories={tab.categories}
        formData={tab.itemFormData}
        onOpenChange={tab.setIsEditItemDialogOpen}
        onFormDataChange={tab.setItemFormData}
        onSubmit={tab.handleUpdateItem}
      />
    </div>
  );
}
