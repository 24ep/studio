"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { readJsonOrFallback } from "@/lib/response-json";
import type { Category, CategoryItem } from "./CategoriesTreeParts";
import { buildCategoryTree } from "./categories-tree-utils";
import type { UseCategoriesTreeTabOptions } from "./categories-tree-tab-types";

export function useCategoriesTreeData({
  categoryTitle,
  itemTitle,
  categoriesEndpoint,
  itemsEndpoint,
}: UseCategoriesTreeTabOptions) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const categoryTree = useMemo(
    () => buildCategoryTree(categories, items),
    [categories, items],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(categoriesEndpoint);
      if (response.ok) {
        setCategories(await readJsonOrFallback<Category[]>(response, []));
      }
    } catch (error) {
      console.error(`Error fetching ${categoryTitle.toLowerCase()}:`, error);
      toast.error(`Failed to fetch ${categoryTitle.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [categoriesEndpoint, categoryTitle]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(itemsEndpoint);
      if (response.ok) {
        setItems(await readJsonOrFallback<CategoryItem[]>(response, []));
      }
    } catch (error) {
      console.error(`Error fetching ${itemTitle.toLowerCase()}:`, error);
    }
  }, [itemsEndpoint, itemTitle]);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [fetchCategories, fetchItems]);

  useEffect(() => {
    if (categories.length > 0) {
      setExpandedCategories(new Set(categories.map((category) => category.id)));
    }
  }, [categories]);

  const toggleCategoryExpansion = useCallback((categoryId: string) => {
    setExpandedCategories((previous) => {
      const next = new Set(previous);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const toggleAllCategories = useCallback(() => {
    setExpandedCategories((previous) => {
      if (previous.size === categories.length) {
        return new Set();
      }

      return new Set(categories.map((category) => category.id));
    });
  }, [categories]);

  return {
    categories,
    categoryTree,
    expandedCategories,
    fetchCategories,
    fetchItems,
    items,
    loading,
    toggleAllCategories,
    toggleCategoryExpansion,
  };
}
