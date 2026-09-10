import type React from 'react';

import type { CategoryItem } from './CategoriesTreeTypes';
import {
  getCategoryTreeConnectorHeight,
  shouldShowCategoryTreeHorizontalConnector,
  shouldShowCategoryTreeLastConnector,
  shouldShowCategoryTreeVerticalConnector,
} from './categories-tree-utils';

export function CategoryTreeItemsConnector({
  children,
  items,
}: {
  children: React.ReactNode;
  items: CategoryItem[];
}) {
  return (
    <div className="relative ml-2">
      {shouldShowCategoryTreeVerticalConnector(items.length) && (
        <div
          className="absolute left-4 top-0 w-px bg-muted-foreground/30 rounded-full"
          style={{ height: getCategoryTreeConnectorHeight(items.length) }}
        />
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function CategoryTreeItemConnector({
  children,
  index,
  itemCount,
}: {
  children: React.ReactNode;
  index: number;
  itemCount: number;
}) {
  return (
    <div className="relative">
      {shouldShowCategoryTreeHorizontalConnector(index, itemCount) && (
        <div className="absolute left-4 top-3 w-4 h-px bg-muted-foreground/30 rounded-full" />
      )}

      {shouldShowCategoryTreeLastConnector(index, itemCount) && (
        <div className="absolute left-4 top-3 w-px h-3 bg-muted-foreground/30 rounded-full" />
      )}

      {children}
    </div>
  );
}
