"use client";

import { useDynamicZIndex } from '@/contexts/ZIndexContext';
import { TreeViewCreateDialogs } from './TreeViewCreateDialogs';
import { TreeViewTree } from './TreeViewTree';
import { useTreeViewController } from './use-tree-view-controller';

interface TreeViewProps {
  title: string;
  categoryTitle: string;
  itemTitle: string;
  categoriesEndpoint: string;
  itemsEndpoint: string;
  isPersonalityTraits?: boolean;
}

export default function TreeView({
  title,
  categoryTitle,
  itemTitle,
  categoriesEndpoint,
  itemsEndpoint,
  isPersonalityTraits = false
}: TreeViewProps) {
  const { contentZIndex: modalZIndex } = useDynamicZIndex('tree-view-modals', 'modal');
  const controller = useTreeViewController({
    categoriesEndpoint,
    itemsEndpoint,
    categoryTitle,
    itemTitle,
    isPersonalityTraits,
  });

  if (controller.loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Categories tree structure
            </p>
          </div>
        </div>
        <TreeViewCreateDialogs
          categoryTitle={categoryTitle}
          itemTitle={itemTitle}
          categories={controller.categories}
          isPersonalityTraits={isPersonalityTraits}
          categoryFormData={controller.categoryFormData}
          setCategoryFormData={controller.setCategoryFormData}
          itemFormData={controller.itemFormData}
          setItemFormData={controller.setItemFormData}
          mainIconFile={controller.mainIconFile}
          mainIconPreview={controller.mainIconPreview}
          showAdvancedConfigItem={controller.showAdvancedConfigItem}
          setShowAdvancedConfigItem={controller.setShowAdvancedConfigItem}
          isCreateCategoryDialogOpen={controller.isCreateCategoryDialogOpen}
          setIsCreateCategoryDialogOpen={controller.setIsCreateCategoryDialogOpen}
          isCreateItemDialogOpen={controller.isCreateItemDialogOpen}
          setIsCreateItemDialogOpen={controller.setIsCreateItemDialogOpen}
          onCreateCategory={controller.handleCreateCategory}
          onCreateItem={controller.handleCreateItem}
          onMainFileUpload={controller.handleMainFileUpload}
          onRemoveMainIcon={controller.removeMainIcon}
        />
      </div>

      {/* Tree View */}
      <div className="space-y-4">
        <TreeViewTree
          data={controller.data}
          categories={controller.categories}
          activeId={controller.activeId}
          categoryTitle={categoryTitle}
          itemTitle={itemTitle}
          itemsEndpoint={itemsEndpoint}
          modalZIndex={modalZIndex}
          isPersonalityTraits={isPersonalityTraits}
          onToggle={controller.handleToggle}
          onRefresh={controller.fetchData}
          onDragStart={controller.handleDragStart}
          onDragEnd={controller.handleDragEnd}
        />
      </div>
    </div>
  );
}
