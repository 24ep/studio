"use client";

import {
  Draggable,
  type DraggableProvidedDragHandleProps,
  type DraggableProvidedDraggableProps,
} from "@hello-pangea/dnd";
import { Edit3, GripVertical, KanbanSquare, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RecruitmentStage } from "@/lib/types";
import { isSystemRecruitmentStage } from "@/lib/recruitment-stage-system-shared";

import type { RecruitmentStagesListProps } from "./RecruitmentStagesPageViewTypes";

function canDeleteStage(stage: RecruitmentStage) {
  return !isSystemRecruitmentStage(stage);
}

interface RecruitmentStageDraggableCardProps {
  stage: RecruitmentStage;
  index: number;
  onOpenModal: RecruitmentStagesListProps["onOpenModal"];
  onAttemptDelete: RecruitmentStagesListProps["onAttemptDelete"];
}

export function EmptyRecruitmentStages({
  onOpenModal,
}: Pick<RecruitmentStagesListProps, "onOpenModal">) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <KanbanSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-base font-semibold text-foreground mb-2">No Stages Configured</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Get started by creating your first recruitment stage.
        </p>
        <Button onClick={() => onOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create First Stage
        </Button>
      </CardContent>
    </Card>
  );
}

export function RecruitmentStageDraggableCard({
  stage,
  index,
  onOpenModal,
  onAttemptDelete,
}: RecruitmentStageDraggableCardProps) {
  return (
    <Draggable key={stage.id} draggableId={stage.id} index={index}>
      {(provided, snapshot) => (
        <RecruitmentStageCard
          stage={stage}
          isDragging={snapshot.isDragging}
          onOpenModal={onOpenModal}
          onAttemptDelete={onAttemptDelete}
          dragRef={provided.innerRef}
          draggableProps={provided.draggableProps}
          dragHandleProps={provided.dragHandleProps}
        />
      )}
    </Draggable>
  );
}

function RecruitmentStageCard({
  stage,
  isDragging,
  onOpenModal,
  onAttemptDelete,
  dragRef,
  draggableProps,
  dragHandleProps,
}: {
  stage: RecruitmentStage;
  isDragging: boolean;
  onOpenModal: RecruitmentStagesListProps["onOpenModal"];
  onAttemptDelete: RecruitmentStagesListProps["onAttemptDelete"];
  dragRef: (element: HTMLElement | null) => void;
  draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}) {
  return (
    <Card
      ref={dragRef}
      {...draggableProps}
      className={`transition-all duration-200 ${
        isDragging ? "shadow-lg scale-105" : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              {...dragHandleProps}
              className="cursor-move text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-foreground">{stage.name}</h3>
              </div>

              {stage.description && (
                <p className="text-xs text-muted-foreground">
                  {stage.description}
                </p>
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
            {canDeleteStage(stage) && (
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
