"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { buildTreeDataFromCategoriesAndItems, type TreeNodeData } from './tree-view-utils';
import type { TreeCategoryOption } from './TreeCategorySelect';

interface UseTreeViewDataLoaderOptions {
  categoriesEndpoint: string;
  itemsEndpoint: string;
}

export function useTreeViewDataLoader({
  categoriesEndpoint,
  itemsEndpoint,
}: UseTreeViewDataLoaderOptions) {
  const [data, setData] = useState<TreeNodeData[]>([]);
  const [categories, setCategories] = useState<TreeCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [categoriesResponse, itemsResponse] = await Promise.all([
        fetch(categoriesEndpoint),
        fetch(itemsEndpoint),
      ]);

      const [categoriesData, items] = await Promise.all([
        categoriesResponse.json(),
        itemsResponse.json(),
      ]);

      setCategories(categoriesData);
      setData(buildTreeDataFromCategoriesAndItems(categoriesData, items));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [categoriesEndpoint, itemsEndpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    categories,
    data,
    fetchData,
    loading,
    setData,
  };
}
