"use client";

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { BadgeCheck, Edit3, GripVertical, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PositionLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PositionLevelsListProps {
  levels: PositionLevel[];
  onDelete: (level: PositionLevel) => void;
  onDragEnd: (result: DropResult) => void;
  onEdit: (level: PositionLevel) => void;
}

export function PositionLevelsList({
  levels,
  onDelete,
  onDragEnd,
  onEdit,
}: PositionLevelsListProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="position-levels">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 pb-6">
            {levels.map((level, index) => (
              <Draggable key={level.id} draggableId={level.id} index={index}>
                {(provided) => (
                  <PositionLevelRow
                    dragHandleProps={provided.dragHandleProps}
                    draggableProps={provided.draggableProps}
                    innerRef={provided.innerRef}
                    level={level}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

function PositionLevelRow({
  dragHandleProps,
  draggableProps,
  innerRef,
  level,
  onDelete,
  onEdit,
}: {
  dragHandleProps: React.HTMLAttributes<HTMLElement> | null;
  draggableProps: React.HTMLAttributes<HTMLElement>;
  innerRef: (element?: HTMLElement | null) => void;
  level: PositionLevel;
  onDelete: (level: PositionLevel) => void;
  onEdit: (level: PositionLevel) => void;
}) {
  return (
    <Card
      ref={innerRef}
      {...draggableProps}
      className={cn('overflow-hidden !bg-card', !level.isActive && 'opacity-60')}
    >
      <CardContent className="bg-card p-4 dark:bg-[#151e29]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div {...dragHandleProps}>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center space-x-3">
              <Badge style={{ backgroundColor: level.color || '#6B7280' }} className="text-white">
                {level.name}
              </Badge>
              {level.isActive && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Active
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(level)}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(level)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {level.description && (
          <p className="text-sm text-muted-foreground mt-2 ml-7">{level.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
