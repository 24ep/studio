import { useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'react-hot-toast';

import { saveBaseSortOrder } from './base-groups-and-items-api';
import {
  applySortedItemOrder,
  buildSortOrderUpdates,
  getItemsForSelectedGroup,
} from './base-groups-and-items-utils';
import type {
  BaseGroup,
  BaseItem,
} from './BaseGroupsAndItemsParts';

interface UseBaseGroupsAndItemsDragInput {
  fetchGroups: () => void;
  fetchItems: () => void;
  groupTitle: string;
  groups: BaseGroup[];
  groupsEndpoint: string;
  itemTitle: string;
  items: BaseItem[];
  itemsEndpoint: string;
  selectedGroupId: string;
  setGroups: (groups: BaseGroup[]) => void;
  setItems: (items: BaseItem[]) => void;
}

export function useBaseGroupsAndItemsDrag({
  fetchGroups,
  fetchItems,
  groupTitle,
  groups,
  groupsEndpoint,
  itemTitle,
  items,
  itemsEndpoint,
  selectedGroupId,
  setGroups,
  setItems,
}: UseBaseGroupsAndItemsDragInput) {
  const handleGroupDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id === over?.id) return;

    const oldIndex = groups.findIndex(group => group.id === active.id);
    const newIndex = groups.findIndex(group => group.id === over?.id);
    const newGroups = arrayMove(groups, oldIndex, newIndex);

    setGroups(newGroups);

    try {
      await saveBaseSortOrder(groupsEndpoint, buildSortOrderUpdates(newGroups));
      toast.success(`${groupTitle} reordered successfully`);
    } catch (error) {
      console.error('Error updating group order:', error);
      toast.error('Failed to save group order');
      fetchGroups();
    }
  }, [fetchGroups, groupTitle, groups, groupsEndpoint, setGroups]);

  const handleItemDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id === over?.id) return;

    const filteredItems = getItemsForSelectedGroup(items, selectedGroupId);
    const oldIndex = filteredItems.findIndex(item => item.id === active.id);
    const newIndex = filteredItems.findIndex(item => item.id === over?.id);
    const newItems = arrayMove(filteredItems, oldIndex, newIndex);

    setItems(applySortedItemOrder(items, newItems));

    try {
      await saveBaseSortOrder(itemsEndpoint, buildSortOrderUpdates(newItems));
      toast.success(`${itemTitle} reordered successfully`);
    } catch (error) {
      console.error('Error updating item order:', error);
      toast.error('Failed to save item order');
      fetchItems();
    }
  }, [fetchItems, itemTitle, items, itemsEndpoint, selectedGroupId, setItems]);

  return {
    handleGroupDragEnd,
    handleItemDragEnd,
  };
}
