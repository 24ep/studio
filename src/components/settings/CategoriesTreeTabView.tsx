"use client";

import { AlertCircle, ChevronDown, ChevronRight, Plus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { CategoriesTreeList, type Category, type CategoryItem } from "./CategoriesTreeParts";

interface CategoriesTreeTabHeaderProps {
  title: string;
  itemTitle: string;
  onCreateCategory: () => void;
}

export function CategoriesTreeTabHeader({
  title,
  itemTitle,
  onCreateCategory,
}: CategoriesTreeTabHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          Groups are displayed as first-level folders, {itemTitle.toLowerCase()} are items within them
        </p>
      </div>
      <Button onClick={onCreateCategory}>
        <Plus className="h-4 w-4 mr-2" />
        Create Category
      </Button>
    </div>
  );
}

interface CategoriesTreePanelProps {
  categoryTitle: string;
  itemTitle: string;
  categories: Category[];
  items: CategoryItem[];
  categoryTree: Category[];
  expandedCategories: Set<string>;
  modalZIndex: number;
  onToggleAllCategories: () => void;
  onCreateItem: () => void;
  onToggleCategory: (categoryId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditItem: (item: CategoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onRemoveItemFromCategory: (itemId: string) => void;
}

export function CategoriesTreePanel({
  categoryTitle,
  itemTitle,
  categories,
  items,
  categoryTree,
  expandedCategories,
  modalZIndex,
  onToggleAllCategories,
  onCreateItem,
  onToggleCategory,
  onEditCategory,
  onDeleteCategory,
  onEditItem,
  onDeleteItem,
  onRemoveItemFromCategory,
}: CategoriesTreePanelProps) {
  if (categoryTree.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No {categoryTitle.toLowerCase()} found. Create your first category to get started.
        </AlertDescription>
      </Alert>
    );
  }

  const isFullyExpanded = expandedCategories.size === categories.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-muted-foreground">Tree View</h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 border border-muted-foreground/30 rounded-sm" />
            <span>Tree Lines</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAllCategories}
          >
            {isFullyExpanded ? (
              <>
                <ChevronRight className="h-3 w-3 mr-1" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Expand All
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onCreateItem}>
            <Plus className="h-3 w-3 mr-1" />
            Add {itemTitle.slice(0, -1)}
          </Button>
        </div>
      </div>

      <CategoriesTreeList
        categories={categoryTree}
        items={items}
        expandedCategories={expandedCategories}
        modalZIndex={modalZIndex}
        onToggleCategory={onToggleCategory}
        onEditCategory={onEditCategory}
        onDeleteCategory={onDeleteCategory}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onRemoveItemFromCategory={onRemoveItemFromCategory}
      />
    </div>
  );
}
