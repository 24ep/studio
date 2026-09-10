"use client";

import {
  closestCenter,
  DndContext,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { BaseAddItemPopover } from './BaseGroupsAndItemsParts';
import { BaseGroupsAndItemsSharedProps } from './BaseGroupsAndItemsTabTypes';
import { SortableItem } from './BaseGroupsAndItemsSortable';
import { useBaseGroupsAndItemsSensors } from './BaseGroupsAndItemsDnd';

export function BaseItemsPanel({
  controller,
  itemTitle,
  modalZIndex,
  showSkillFields = false,
}: BaseGroupsAndItemsSharedProps) {
  const sensors = useBaseGroupsAndItemsSensors();
  const selectedGroupName = controller.groups.find((group) => group.id === controller.selectedGroupId)?.name;

  return (
    <div className="col-span-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {controller.selectedGroupId === 'all'
              ? `All ${itemTitle}`
              : `${selectedGroupName} ${itemTitle}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {controller.selectedGroupId === 'all'
              ? `All ${itemTitle.toLowerCase()} across all groups`
              : `${itemTitle} in the selected group`}
          </p>
        </div>
        <BaseAddItemPopover
          open={controller.itemSearchOpen}
          searchValue={controller.itemSearchValue}
          itemTitle={itemTitle}
          availableItems={controller.availableItems}
          showSkillFields={showSkillFields}
          onOpenChange={controller.setItemSearchOpen}
          onSearchValueChange={controller.setItemSearchValue}
          onAddExistingItem={controller.handleAddExistingItemToGroup}
          onCreateNewItem={controller.openCreateItemDialog}
        />
      </div>

      {controller.filteredItems.length === 0 ? (
        <BaseItemsEmptyState
          itemTitle={itemTitle}
          selectedGroupId={controller.selectedGroupId}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={controller.handleItemDragEnd}
        >
          <SortableContext
            items={controller.filteredItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {controller.filteredItems.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  itemTitle={itemTitle}
                  showSkillFields={showSkillFields}
                  onEdit={controller.openEditItemDialog}
                  onDelete={controller.handleDeleteItem}
                  onRemoveFromGroup={controller.handleRemoveItemFromGroup}
                  onToggleActive={controller.handleToggleActive}
                  selectedGroupId={controller.selectedGroupId}
                  modalZIndex={modalZIndex}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function BaseItemsEmptyState({
  itemTitle,
  selectedGroupId,
}: {
  itemTitle: string;
  selectedGroupId: string;
}) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {selectedGroupId === 'all'
          ? `No ${itemTitle.toLowerCase()} found. Create your first ${itemTitle.toLowerCase()} to get started.`
          : `No ${itemTitle.toLowerCase()} in this group. Add ${itemTitle.toLowerCase()} using the "Add ${itemTitle.slice(0, -1)}" button.`}
      </AlertDescription>
    </Alert>
  );
}
