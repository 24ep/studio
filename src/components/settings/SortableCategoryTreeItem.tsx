"use client";

import { FileText, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { CategoryItem } from './CategoriesTreeParts';
import {
  buildCategoryTreeSortableStyle,
  getCategoryTreeItemContainerClassName,
} from './categories-tree-utils';
import { SortableCategoryItemActions } from './SortableCategoryTreeActions';

export function SortableItem({
  item,
  onEdit,
  onDelete,
  onRemoveFromCategory,
  selectedCategoryId,
  modalZIndex,
}: {
  item: CategoryItem;
  onEdit: (item: CategoryItem) => void;
  onDelete: (id: string) => void;
  onRemoveFromCategory: (id: string) => void;
  selectedCategoryId: string;
  modalZIndex: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = buildCategoryTreeSortableStyle(CSS.Transform.toString(transform), transition);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={getCategoryTreeItemContainerClassName(isDragging)}
    >
      <div className="group flex cursor-pointer items-center gap-2 rounded-full border border-transparent bg-card/50 px-3 py-1.5 transition-all duration-200 hover:border-border hover:bg-muted/20">
        <div
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </div>
        <FileText className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{item.name}</span>

        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <SortableCategoryItemActions
            item={item}
            modalZIndex={modalZIndex}
            onDelete={onDelete}
            onEdit={onEdit}
            onRemoveFromCategory={onRemoveFromCategory}
            selectedCategoryId={selectedCategoryId}
          />
        </div>
      </div>
    </div>
  );
}
