"use client";

import { Edit, MoreVertical, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { Category, CategoryItem } from './CategoriesTreeParts';
import {
  getCategoryTreeDropdownZIndex,
  shouldShowCategoryItemRemoveAction,
} from './categories-tree-utils';

export function SortableCategoryActions({
  category,
  modalZIndex,
  onDelete,
  onEdit,
}: {
  category: Category;
  modalZIndex: number;
  onDelete: (id: string) => void;
  onEdit: (category: Category) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={{ zIndex: getCategoryTreeDropdownZIndex(modalZIndex) }}>
        <DropdownMenuItem onClick={() => onEdit(category)}>
          <Edit className="h-3 w-3 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(category.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SortableCategoryItemActions({
  item,
  modalZIndex,
  onDelete,
  onEdit,
  onRemoveFromCategory,
  selectedCategoryId,
}: {
  item: CategoryItem;
  modalZIndex: number;
  onDelete: (id: string) => void;
  onEdit: (item: CategoryItem) => void;
  onRemoveFromCategory: (id: string) => void;
  selectedCategoryId: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={{ zIndex: getCategoryTreeDropdownZIndex(modalZIndex) }}>
        <DropdownMenuItem onClick={() => onEdit(item)}>
          <Edit className="h-3 w-3 mr-2" />
          Edit
        </DropdownMenuItem>
        {shouldShowCategoryItemRemoveAction(item, selectedCategoryId) && (
          <DropdownMenuItem onClick={() => onRemoveFromCategory(item.id)}>
            <X className="h-3 w-3 mr-2" />
            Remove
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(item.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
