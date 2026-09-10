"use client";

import React from 'react';
import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import type { TreeNodeData } from './tree-view-utils';
import type { TreeCategoryOption } from './TreeCategorySelect';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TreeNodeDialogs, TreeNodeRow } from './TreeViewNodeParts';
import { useTreeViewNodeActions } from './use-tree-view-node-actions';

export function SortableTreeNode({
  node,
  level = 0,
  onToggle,
  itemTitle,
  categoryTitle,
  modalZIndex,
  isPersonalityTraits = false,
  categories = [],
  itemsEndpoint,
  onRefresh,
}: {
  node: TreeNodeData;
  level: number;
  onToggle: (nodeId: string) => void;
  itemTitle: string;
  categoryTitle: string;
  modalZIndex: number;
  isPersonalityTraits?: boolean;
  categories?: TreeCategoryOption[];
  itemsEndpoint?: string;
  onRefresh?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: {
      type: node.type,
      node,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TreeNode
        node={node}
        level={level}
        onToggle={onToggle}
        itemTitle={itemTitle}
        categoryTitle={categoryTitle}
        modalZIndex={modalZIndex}
        dragHandleProps={listeners}
        isPersonalityTraits={isPersonalityTraits}
        categories={categories}
        itemsEndpoint={itemsEndpoint}
        onRefresh={onRefresh}
      />
    </div>
  );
}

function TreeNode({
  node,
  level = 0,
  onToggle,
  itemTitle,
  categoryTitle,
  modalZIndex,
  dragHandleProps,
  isPersonalityTraits = false,
  categories = [],
  itemsEndpoint,
  onRefresh,
}: {
  node: TreeNodeData;
  level: number;
  onToggle: (nodeId: string) => void;
  itemTitle: string;
  categoryTitle: string;
  modalZIndex: number;
  dragHandleProps?: DraggableSyntheticListeners;
  isPersonalityTraits?: boolean;
  categories?: TreeCategoryOption[];
  itemsEndpoint?: string;
  onRefresh?: () => void;
}) {
  const isFolder = node.type === 'folder';
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = node.isExpanded || false;
  const actions = useTreeViewNodeActions({
    node,
    itemTitle,
    categories,
    itemsEndpoint,
    isPersonalityTraits,
    onRefresh,
  });

  return (
    <>
      <div className="relative">
        <TreeNodeRow
          node={node}
          level={level}
          isFolder={isFolder}
          hasChildren={Boolean(hasChildren)}
          isExpanded={isExpanded}
          itemTitle={itemTitle}
          modalZIndex={modalZIndex}
          dragHandleProps={dragHandleProps}
          onToggle={onToggle}
          onEdit={actions.openEditDialog}
          onCreateChild={actions.openCreateChildDialog}
          onOpenRemoveFromGroup={() => actions.setIsRemoveFromGroupDialogOpen(true)}
          onOpenDelete={() => actions.setIsDeleteDialogOpen(true)}
        />

        {isFolder && isExpanded && hasChildren && (
          <SortableContext items={(node.children?.map(child => child.id)) || []} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {(node.children || []).map((child) => (
                <SortableTreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onToggle={onToggle}
                  itemTitle={itemTitle}
                  categoryTitle={categoryTitle}
                  modalZIndex={modalZIndex}
                  isPersonalityTraits={isPersonalityTraits}
                  categories={categories}
                  itemsEndpoint={itemsEndpoint}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      <TreeNodeDialogs
        node={node}
        itemTitle={itemTitle}
        categoryTitle={categoryTitle}
        categories={categories}
        isFolder={isFolder}
        isPersonalityTraits={isPersonalityTraits}
        formData={actions.formData}
        showAdvancedConfig={actions.showAdvancedConfig}
        iconFile={actions.iconFile}
        iconPreview={actions.iconPreview}
        isCreateDialogOpen={actions.isCreateDialogOpen}
        isEditDialogOpen={actions.isEditDialogOpen}
        isRemoveFromGroupDialogOpen={actions.isRemoveFromGroupDialogOpen}
        isDeleteDialogOpen={actions.isDeleteDialogOpen}
        setFormData={actions.setFormData}
        setShowAdvancedConfig={actions.setShowAdvancedConfig}
        setIsCreateDialogOpen={actions.setIsCreateDialogOpen}
        setIsEditDialogOpen={actions.setIsEditDialogOpen}
        setIsRemoveFromGroupDialogOpen={actions.setIsRemoveFromGroupDialogOpen}
        setIsDeleteDialogOpen={actions.setIsDeleteDialogOpen}
        onFileUpload={actions.handleFileUpload}
        onRemoveIcon={actions.removeIcon}
        onCreateChildItem={actions.handleCreateChildItem}
        onUpdateItem={actions.handleUpdateItem}
        onRemoveFromGroup={actions.handleRemoveFromGroup}
        onPermanentDelete={actions.handlePermanentDelete}
      />
    </>
  );
}
