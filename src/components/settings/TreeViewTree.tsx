"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { TreeCategoryOption } from './TreeCategorySelect';
import { SortableTreeNode } from './TreeViewNode';
import { getTreeNodeNameById, type TreeNodeData } from './tree-view-utils';

interface TreeViewTreeProps {
  data: TreeNodeData[];
  categories: TreeCategoryOption[];
  activeId: string | null;
  categoryTitle: string;
  itemTitle: string;
  itemsEndpoint: string;
  modalZIndex: number;
  isPersonalityTraits: boolean;
  onToggle: (nodeId: string) => void;
  onRefresh: () => Promise<void>;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function TreeViewTree({
  data,
  categories,
  activeId,
  categoryTitle,
  itemTitle,
  itemsEndpoint,
  modalZIndex,
  isPersonalityTraits,
  onToggle,
  onRefresh,
  onDragStart,
  onDragEnd,
}: TreeViewTreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {categoryTitle.toLowerCase()} found. Create your first category to get started.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="p-4 bg-muted/10 rounded-lg">
        <SortableContext items={data.map(category => category.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {data.map((category) => (
              <SortableTreeNode
                key={category.id}
                node={category}
                level={0}
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
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
            <span className="text-sm font-medium">
              {getTreeNodeNameById(data, activeId)}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
