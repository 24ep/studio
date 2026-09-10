"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

import { SortableCategory, SortableItem } from './CategoriesTreeSortableParts';
import type { Category, CategoryItem } from './CategoriesTreeTypes';
import { CategoryTreeItemConnector, CategoryTreeItemsConnector } from './CategoriesTreeConnectors';
import {
  getCategoryItemsForCategory,
  hasCategoryTreeItems,
} from './categories-tree-utils';

export function CategoriesTreeList({
  categories,
  items,
  expandedCategories,
  modalZIndex,
  onToggleCategory,
  onEditCategory,
  onDeleteCategory,
  onEditItem,
  onDeleteItem,
  onRemoveItemFromCategory,
}: {
  categories: Category[];
  items: CategoryItem[];
  expandedCategories: Set<string>;
  modalZIndex: number;
  onToggleCategory: (categoryId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditItem: (item: CategoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onRemoveItemFromCategory: (itemId: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={() => {}}>
      <SortableContext items={categories.map(category => category.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1 p-4 bg-muted/10 rounded-lg">
          {categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const categoryItems = getCategoryItemsForCategory(items, category.id);

            return (
              <div key={category.id} className="space-y-1">
                <SortableCategory
                  category={category}
                  categoryItems={categoryItems}
                  isExpanded={isExpanded}
                  onToggleExpanded={() => onToggleCategory(category.id)}
                  onEdit={onEditCategory}
                  onDelete={onDeleteCategory}
                  modalZIndex={modalZIndex}
                />

                <Collapsible open={isExpanded} onOpenChange={() => onToggleCategory(category.id)}>
                  <CollapsibleContent className="space-y-1">
                    {hasCategoryTreeItems(categoryItems) && (
                      <CategoryTreeItemsConnector items={categoryItems}>
                        {categoryItems.map((item, index) => (
                          <CategoryTreeItemConnector
                            key={item.id}
                            index={index}
                            itemCount={categoryItems.length}
                          >
                            <SortableItem
                              item={item}
                              onEdit={onEditItem}
                              onDelete={onDeleteItem}
                              onRemoveFromCategory={onRemoveItemFromCategory}
                              selectedCategoryId={category.id}
                              modalZIndex={modalZIndex}
                            />
                          </CategoryTreeItemConnector>
                        ))}
                      </CategoryTreeItemsConnector>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
