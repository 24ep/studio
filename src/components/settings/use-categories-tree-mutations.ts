"use client";

import { useCategoriesTreeCategoryMutations } from "./use-categories-tree-category-mutations";
import { useCategoriesTreeItemMutations } from "./use-categories-tree-item-mutations";
import type { CategoriesTreeMutationOptions } from "./categories-tree-mutation-types";

export function useCategoriesTreeMutations({
  categoryTitle,
  itemTitle,
  categoriesEndpoint,
  itemsEndpoint,
  dialogs,
  fetchCategories,
  fetchItems,
}: CategoriesTreeMutationOptions) {
  const categoryMutations = useCategoriesTreeCategoryMutations({
    categoryTitle,
    itemTitle,
    categoriesEndpoint,
    itemsEndpoint,
    dialogs,
    fetchCategories,
    fetchItems,
  });

  const itemMutations = useCategoriesTreeItemMutations({
    categoryTitle,
    itemTitle,
    categoriesEndpoint,
    itemsEndpoint,
    dialogs,
    fetchCategories,
    fetchItems,
  });

  return {
    ...categoryMutations,
    ...itemMutations,
  };
}
