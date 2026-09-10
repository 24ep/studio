"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  GripVertical,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Category, CategoryItem } from './CategoriesTreeParts';
import {
  buildCategoryTreeSortableStyle,
  getCategoryTreeCategoryContainerClassName,
  hasCategoryTreeItems,
} from './categories-tree-utils';
import { SortableCategoryActions } from './SortableCategoryTreeActions';

export function SortableCategory({
  category,
  categoryItems,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  modalZIndex,
}: {
  category: Category;
  categoryItems: CategoryItem[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  modalZIndex: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = buildCategoryTreeSortableStyle(CSS.Transform.toString(transform), transition);
  const hasItems = hasCategoryTreeItems(categoryItems);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={getCategoryTreeCategoryContainerClassName(isDragging)}
    >
      <div
        className="group flex cursor-pointer items-center gap-2 rounded-full border border-transparent bg-card/50 px-3 py-2 transition-all duration-200 hover:border-border hover:bg-muted/30"
        onClick={onToggleExpanded}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
      >
        {hasItems && (
          <div className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium">{category.name}</span>
          {hasItems && (
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {categoryItems.length}
            </span>
          )}
        </div>

        <div
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </div>

        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <SortableCategoryActions
            category={category}
            modalZIndex={modalZIndex}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      </div>
    </div>
  );
}
