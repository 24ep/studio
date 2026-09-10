import type { Category, CategoryItem, CategoryItemFormData } from './CategoriesTreeParts';
import type { CSSProperties } from 'react';

const TREE_DROPDOWN_Z_INDEX_OFFSET = 10;

export function getCategoryItemCategoryId(item: CategoryItem) {
  return item.categoryId || item.groupId;
}

export function getCategoryItemsForCategory(items: CategoryItem[], categoryId: string) {
  return items.filter(item => getCategoryItemCategoryId(item) === categoryId);
}

export function hasCategoryTreeItems(items: CategoryItem[]) {
  return items.length > 0;
}

export function buildCategoryTreeSortableStyle(
  transform: string | undefined,
  transition?: string | null
): CSSProperties {
  return {
    transform,
    transition: transition ?? undefined,
  };
}

export function getCategoryTreeCategoryContainerClassName(isDragging: boolean) {
  return isDragging ? 'transition-all duration-200 opacity-50' : 'transition-all duration-200';
}

export function getCategoryTreeItemContainerClassName(isDragging: boolean) {
  return isDragging ? 'opacity-50 ml-6' : 'ml-6';
}

export function getCategoryTreeDropdownZIndex(modalZIndex: number) {
  return modalZIndex + TREE_DROPDOWN_Z_INDEX_OFFSET;
}

export function shouldShowCategoryItemRemoveAction(item: CategoryItem, selectedCategoryId: string) {
  return selectedCategoryId !== 'all' && getCategoryItemCategoryId(item) === selectedCategoryId;
}

export function getCategoryTreeConnectorHeight(itemCount: number) {
  return `${(itemCount - 1) * 24 + 12}px`;
}

export function shouldShowCategoryTreeVerticalConnector(itemCount: number) {
  return itemCount > 1;
}

export function shouldShowCategoryTreeHorizontalConnector(index: number, itemCount: number) {
  return index < itemCount - 1;
}

export function shouldShowCategoryTreeLastConnector(index: number, itemCount: number) {
  return index === itemCount - 1;
}

export function buildCategoryTree(categories: Category[], items: CategoryItem[]) {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [], items: [] });
  });

  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id);

    if (categoryWithChildren && !category.parentId) {
      rootCategories.push(categoryWithChildren);
    }
  });

  items.forEach(item => {
    const categoryId = getCategoryItemCategoryId(item);

    if (categoryId && categoryMap.has(categoryId)) {
      categoryMap.get(categoryId)?.items?.push(item);
    }
  });

  return rootCategories.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function buildCategoryItemPayload(formData: CategoryItemFormData) {
  return {
    ...formData,
    categoryId: formData.categoryId === 'none' ? null : formData.categoryId,
    groupId: formData.groupId === 'none' ? null : formData.groupId,
  };
}

export function buildCategoryItemFormState(item?: Partial<CategoryItem>): CategoryItemFormData {
  return {
    name: item?.name || '',
    categoryId: item?.categoryId || 'none',
    groupId: item?.groupId || 'none',
  };
}
