"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import type { DraggableProvidedDragHandleProps, DraggableProvidedDraggableProps, DropResult } from "@hello-pangea/dnd";
import { Edit, GripVertical, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import type { HeadcountTypeOption } from "./headcount-types-tab-types";

interface HeadcountTypesListProps {
  options: HeadcountTypeOption[];
  onDelete: (value: string) => void;
  onDragEnd: (result: DropResult) => void;
  onEdit: (option: HeadcountTypeOption) => void;
  onToggleActive: (value: string) => void;
}

export function HeadcountTypesList({
  options,
  onDelete,
  onDragEnd,
  onEdit,
  onToggleActive,
}: HeadcountTypesListProps) {
  if (options.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No headcount types configured yet</p>
        <p className="text-sm">Add your first headcount type to get started</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="headcount-types">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {options.map((option, index) => (
              <Draggable key={option.value} draggableId={option.value} index={index}>
                {(provided) => (
                  <HeadcountTypeRow
                    option={option}
                    draggableProps={provided.draggableProps}
                    dragHandleProps={provided.dragHandleProps}
                    innerRef={provided.innerRef}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onToggleActive={onToggleActive}
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

function HeadcountTypeRow({
  option,
  draggableProps,
  dragHandleProps,
  innerRef,
  onDelete,
  onEdit,
  onToggleActive,
}: {
  option: HeadcountTypeOption;
  draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  innerRef: (element?: HTMLElement | null) => void;
  onDelete: (value: string) => void;
  onEdit: (option: HeadcountTypeOption) => void;
  onToggleActive: (value: string) => void;
}) {
  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <div
          {...dragHandleProps}
          className="cursor-move text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: option.color }}
        />
        <div>
          <div className="font-medium">{option.label}</div>
          <div className="text-sm text-muted-foreground">
            Value: {option.value}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={`active-${option.value}`} className="text-sm">
            Active
          </Label>
          <Switch
            id={`active-${option.value}`}
            checked={option.isActive}
            onCheckedChange={() => onToggleActive(option.value)}
          />
        </div>

        <Button variant="ghost" size="sm" onClick={() => onEdit(option)}>
          <Edit className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={() => onDelete(option.value)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
