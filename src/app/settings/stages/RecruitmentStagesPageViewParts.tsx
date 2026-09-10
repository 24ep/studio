"use client";

import {
  DragDropContext,
  Droppable,
} from "@hello-pangea/dnd";
import { KanbanSquare, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

import type {
  RecruitmentStagesHeaderProps,
  RecruitmentStagesListProps,
} from "./RecruitmentStagesPageViewTypes";
import { EmptyRecruitmentStages, RecruitmentStageDraggableCard } from "./RecruitmentStageListItems";
export { ReplacementStageDialog } from "./ReplacementStageDialog";

export function RecruitmentStagesHeader({
  showLogoOnly,
  onOpenModal,
}: RecruitmentStagesHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        {!showLogoOnly && (
          <h1 className="text-xl font-bold text-foreground">Recruitment Stages</h1>
        )}
        <p className="text-sm text-muted-foreground">
          Manage the stages in your recruitment pipeline. Most stages can be deleted, except those with core business logic dependencies.
        </p>
      </div>
      <Button onClick={() => onOpenModal()} variant="default">
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Stage
      </Button>
    </div>
  );
}

export function RecruitmentStagesList({
  stages,
  isLoading,
  fetchError,
  onOpenModal,
  onAttemptDelete,
  onDragEnd,
}: RecruitmentStagesListProps) {
  if (isLoading && stages.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <KanbanSquare className="h-8 w-8 animate-pulse text-primary" />
        <p className="ml-2 text-sm text-muted-foreground">Loading stages...</p>
      </div>
    );
  }

  if (stages.length === 0 && !fetchError) {
    return <EmptyRecruitmentStages onOpenModal={onOpenModal} />;
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
              <RecruitmentStageDraggableCard
                key={stage.id}
                stage={stage}
                index={index}
                onOpenModal={onOpenModal}
                onAttemptDelete={onAttemptDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
