"use client";

import { Clock, Edit3, GripVertical, Trash2 } from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import type {
  DraggableProvidedDragHandleProps,
  DraggableProvidedDraggableProps,
  DropResult,
} from "@hello-pangea/dnd";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Grade } from "@/lib/types";

interface GradesListProps {
  grades: Grade[];
  onDragEnd: (result: DropResult) => void;
  onEdit: (grade: Grade) => void;
  onDeleteRequest: (grade: Grade) => void;
}

export function GradesList({
  grades,
  onDragEnd,
  onEdit,
  onDeleteRequest,
}: GradesListProps) {
  return (
    <ScrollArea className="flex-1">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="grades">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3 pr-4"
            >
              {grades.map((grade, index) => (
                <Draggable key={grade.id} draggableId={grade.id} index={index}>
                  {(provided) => (
                    <GradeListItem
                      grade={grade}
                      dragHandleProps={provided.dragHandleProps}
                      draggableProps={provided.draggableProps}
                      innerRef={provided.innerRef}
                      onDeleteRequest={onDeleteRequest}
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
    </ScrollArea>
  );
}

function GradeListItem({
  grade,
  dragHandleProps,
  draggableProps,
  innerRef,
  onDeleteRequest,
  onEdit,
}: {
  grade: Grade;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  draggableProps: DraggableProvidedDraggableProps;
  innerRef: (element?: HTMLElement | null) => void;
  onDeleteRequest: (grade: Grade) => void;
  onEdit: (grade: Grade) => void;
}) {
  return (
    <Card
      ref={innerRef}
      {...draggableProps}
      className={!grade.isActive ? "opacity-60" : ""}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div {...dragHandleProps}>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center space-x-3">
              <Badge
                style={{ backgroundColor: grade.color || "#3B82F6" }}
                className="text-white"
              >
                {grade.name}
              </Badge>
              {grade.label && (
                <div className="text-sm font-medium text-foreground">
                  {grade.label}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Level {grade.minLevel}-{grade.maxLevel}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {grade.slaDays} days SLA
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!grade.isActive && (
              <Badge variant="secondary">Inactive</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(grade)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteRequest(grade)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {grade.description && (
          <p className="text-sm text-muted-foreground mt-2 ml-7">
            {grade.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
