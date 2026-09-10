"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, CheckCircle, Edit, GripVertical, MoreVertical, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BaseItem } from './BaseGroupsAndItemsParts';
import { getSingularBaseItemTitle } from './base-groups-sortable-utils';

interface SortableItemProps {
  item: BaseItem;
  itemTitle: string;
  showSkillFields: boolean;
  onEdit: (item: BaseItem) => void;
  onDelete: (id: string) => void;
  onRemoveFromGroup: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  selectedGroupId: string;
  modalZIndex: number;
}

export function SortableItem({
  item,
  itemTitle,
  showSkillFields,
  onEdit,
  onDelete,
  onRemoveFromGroup,
  onToggleActive,
  selectedGroupId,
  modalZIndex,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "opacity-50")}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <SortableItemIdentity
            dragAttributes={attributes}
            dragListeners={listeners}
            item={item}
            showSkillFields={showSkillFields}
          />
          <SortableItemActions
            item={item}
            itemTitle={itemTitle}
            modalZIndex={modalZIndex}
            onDelete={onDelete}
            onEdit={onEdit}
            onRemoveFromGroup={onRemoveFromGroup}
            onToggleActive={onToggleActive}
            selectedGroupId={selectedGroupId}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SortableItemIdentity({
  item,
  showSkillFields,
  dragAttributes,
  dragListeners,
}: {
  item: BaseItem;
  showSkillFields: boolean;
  dragAttributes: ReturnType<typeof useSortable>['attributes'];
  dragListeners: ReturnType<typeof useSortable>['listeners'];
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded"
        {...dragAttributes}
        {...dragListeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-3">
        {item.iconUrl && (
          <img
            src={item.iconUrl}
            alt={`${item.name} icon`}
            className="w-6 h-6 rounded"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div>
          <div className="font-medium">{item.name}</div>
          {item.description && (
            <div className="text-sm text-muted-foreground">{item.description}</div>
          )}
          {showSkillFields && <SortableItemSkillMeta item={item} />}
        </div>
      </div>
    </div>
  );
}

function SortableItemSkillMeta({ item }: { item: BaseItem }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <Badge variant={item.skillType === 'hard_skill' ? 'default' : 'secondary'}>
        {item.skillType === 'hard_skill' ? 'Hard Skill' : 'Test Score'}
      </Badge>
      <span className="text-sm text-muted-foreground">
        Max Score: {item.maxScore}
      </span>
    </div>
  );
}

function SortableItemActions({
  item,
  itemTitle,
  selectedGroupId,
  onEdit,
  onDelete,
  onRemoveFromGroup,
  onToggleActive,
  modalZIndex,
}: {
  item: BaseItem;
  itemTitle: string;
  selectedGroupId: string;
  onEdit: (item: BaseItem) => void;
  onDelete: (id: string) => void;
  onRemoveFromGroup: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  modalZIndex: number;
}) {
  const singularItemTitle = getSingularBaseItemTitle(itemTitle);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onToggleActive(item.id, item.isActive)}
      >
        {item.isActive ? (
          <>
            <CheckCircle className="h-4 w-4 mr-1" />
            Active
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 mr-1" />
            Inactive
          </>
        )}
      </Button>
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
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit {singularItemTitle}
          </DropdownMenuItem>
          {selectedGroupId !== 'all' && item.groupId === selectedGroupId && (
            <DropdownMenuItem onClick={() => onRemoveFromGroup(item.id)}>
              <X className="h-4 w-4 mr-2" />
              Remove from Group
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(item.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {singularItemTitle}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
