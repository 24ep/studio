"use client";

import {
  closestCenter,
  DndContext,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { List, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { BaseGroupDialog } from './BaseGroupsAndItemsDialogs';
import { BaseGroupsAndItemsSharedProps } from './BaseGroupsAndItemsTabTypes';
import { SortableGroup } from './BaseGroupsAndItemsSortable';
import { useBaseGroupsAndItemsSensors } from './BaseGroupsAndItemsDnd';

export function BaseGroupsPanel({
  controller,
  groupTitle,
  itemTitle,
  modalZIndex,
  onGroupDetails,
  showGroupDetailsModal = false,
}: BaseGroupsAndItemsSharedProps) {
  const sensors = useBaseGroupsAndItemsSensors();

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{groupTitle}</h3>
        <BaseGroupDialog
          open={controller.isCreateGroupDialogOpen}
          mode="create"
          groupTitle={groupTitle}
          itemTitle={itemTitle}
          formData={controller.groupFormData}
          onOpenChange={controller.setIsCreateGroupDialogOpen}
          onFormDataChange={controller.setGroupFormData}
          onSubmit={controller.handleCreateGroup}
          trigger={(
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          )}
        />
      </div>

      <div className="space-y-0">
        <AllGroupsSelector
          itemCount={controller.items.length}
          itemTitle={itemTitle}
          isSelected={controller.selectedGroupId === 'all'}
          onSelect={() => controller.setSelectedGroupId('all')}
        />

        {controller.groups.length > 0 && (
          <div className="mx-3 my-2 border-t border-border/50" />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={controller.handleGroupDragEnd}
        >
          <SortableContext
            items={controller.groups.map((group) => group.id)}
            strategy={verticalListSortingStrategy}
          >
            {controller.groups.map((group, index) => {
              const groupItems = controller.items.filter((item) => item.groupId === group.id);
              return (
                <div key={group.id}>
                  {index > 0 && (
                    <div className="mx-3 my-2 border-t border-border/50" />
                  )}
                  <SortableGroup
                    group={group}
                    groupItems={groupItems}
                    itemTitle={itemTitle}
                    isSelected={controller.selectedGroupId === group.id}
                    onSelect={() => controller.setSelectedGroupId(group.id)}
                    onEdit={controller.openEditGroupDialog}
                    onDelete={controller.handleDeleteGroup}
                    showGroupDetailsModal={showGroupDetailsModal}
                    onGroupDetails={onGroupDetails ?? controller.openGroupDetailsDialog}
                    modalZIndex={modalZIndex}
                  />
                </div>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function AllGroupsSelector({
  isSelected,
  itemCount,
  itemTitle,
  onSelect,
}: {
  isSelected: boolean;
  itemCount: number;
  itemTitle: string;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        'cursor-pointer rounded-md py-3 transition-colors',
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">All Groups</div>
              <div className="text-sm text-muted-foreground">
                View all {itemTitle.toLowerCase()} across all groups
              </div>
            </div>
          </div>
        </div>
        <Badge variant="outline">{itemCount}</Badge>
      </div>
    </div>
  );
}
