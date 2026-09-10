"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import type {
  DraggableProvidedDragHandleProps,
  DraggableProvidedDraggableProps,
  DropResult,
} from "@hello-pangea/dnd";
import { Edit3, GripVertical, KanbanSquare, PlusCircle, Trash2 } from "lucide-react";

import {
  SettingsEmptyState,
  SettingsLoadingState,
} from "@/components/settings/SettingsTabState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RecruitmentStage } from "@/lib/types";
import { isSystemRecruitmentStage } from "@/lib/recruitment-stage-system-shared";

interface RecruitmentStagesListProps {
  stages: RecruitmentStage[];
  isLoading: boolean;
  onAttemptDelete: (stage: RecruitmentStage) => void;
  onDragEnd: (result: DropResult) => void;
  onOpenModal: (stage?: RecruitmentStage) => void;
}

export function RecruitmentStagesList({
  stages,
  isLoading,
  onAttemptDelete,
  onDragEnd,
  onOpenModal,
}: RecruitmentStagesListProps) {
  if (isLoading && stages.length === 0) {
    return <SettingsLoadingState label="Loading stages..." />;
  }

  if (stages.length === 0) {
    return (
      <SettingsEmptyState
        icon={KanbanSquare}
        title="No Stages Configured"
        description="Get started by creating your first recruitment stage."
        action={(
          <Button onClick={() => onOpenModal()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create First Stage
          </Button>
        )}
      />
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="stages-list">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-4"
          >
            {stages.map((stage, index) => (
              <Draggable key={stage.id} draggableId={stage.id} index={index}>
                {(provided, snapshot) => (
                  <RecruitmentStageCard
                    dragHandleProps={provided.dragHandleProps}
                    draggableProps={provided.draggableProps}
                    innerRef={provided.innerRef}
                    isDragging={snapshot.isDragging}
                    stage={stage}
                    onAttemptDelete={onAttemptDelete}
                    onOpenModal={onOpenModal}
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

function RecruitmentStageCard({
  dragHandleProps,
  draggableProps,
  innerRef,
  isDragging,
  stage,
  onAttemptDelete,
  onOpenModal,
}: {
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  draggableProps: DraggableProvidedDraggableProps;
  innerRef: (element?: HTMLElement | null) => void;
  isDragging: boolean;
  stage: RecruitmentStage;
  onAttemptDelete: (stage: RecruitmentStage) => void;
  onOpenModal: (stage?: RecruitmentStage) => void;
}) {
  return (
    <Card
      ref={innerRef}
      {...draggableProps}
      className={`transition-all duration-200 ${
        isDragging ? "scale-105 shadow-lg" : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div
              {...dragHandleProps}
              className="cursor-move text-muted-foreground transition-colors hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">{stage.name}</h3>
              </div>

              {stage.description && (
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenModal(stage)}
              className="h-7 w-7"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            {!isSystemRecruitmentStage(stage) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAttemptDelete(stage)}
                className="h-7 w-7 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
