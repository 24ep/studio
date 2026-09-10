"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, GripVertical, MoreVertical, Settings, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BaseGroup, BaseItem } from './BaseGroupsAndItemsParts';

interface SortableGroupProps {
  group: BaseGroup;
  groupItems: BaseItem[];
  itemTitle: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (group: BaseGroup) => void;
  onDelete: (id: string) => void;
  showGroupDetailsModal: boolean;
  onGroupDetails?: (group: BaseGroup) => void;
  modalZIndex: number;
}

export function SortableGroup({
  group,
  groupItems,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  showGroupDetailsModal,
  onGroupDetails,
  modalZIndex,
}: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "cursor-pointer transition-colors py-3 rounded-md",
        isSelected ? "bg-primary/10" : "hover:bg-muted/50",
        isDragging && "opacity-50"
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
      <div className="flex items-center justify-between min-w-0">
        <SortableGroupIdentity group={group} dragAttributes={attributes} dragListeners={listeners} />
        <SortableGroupActions
          group={group}
          groupItemsCount={groupItems.length}
          modalZIndex={modalZIndex}
          onDelete={onDelete}
          onEdit={onEdit}
          onGroupDetails={onGroupDetails}
          showGroupDetailsModal={showGroupDetailsModal}
        />
      </div>
    </div>
  );
}

function SortableGroupIdentity({
  group,
  dragAttributes,
  dragListeners,
}: {
  group: BaseGroup;
  dragAttributes: ReturnType<typeof useSortable>['attributes'];
  dragListeners: ReturnType<typeof useSortable>['listeners'];
}) {
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <div
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded"
          {...dragAttributes}
          {...dragListeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{group.name}</div>
            {group.description && (
              <div className="text-sm text-muted-foreground">{group.description}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableGroupActions({
  group,
  groupItemsCount,
  showGroupDetailsModal,
  onGroupDetails,
  onEdit,
  onDelete,
  modalZIndex,
}: {
  group: BaseGroup;
  groupItemsCount: number;
  showGroupDetailsModal: boolean;
  onGroupDetails?: (group: BaseGroup) => void;
  onEdit: (group: BaseGroup) => void;
  onDelete: (id: string) => void;
  modalZIndex: number;
}) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Badge variant="outline">{groupItemsCount}</Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="bg-transparent hover:bg-transparent"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" style={{ zIndex: modalZIndex + 10 }}>
          <DropdownMenuItem onClick={() => onEdit(group)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Group
          </DropdownMenuItem>
          {showGroupDetailsModal && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onGroupDetails?.(group)}>
                <Settings className="h-4 w-4 mr-2" />
                Group Details
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(group.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
