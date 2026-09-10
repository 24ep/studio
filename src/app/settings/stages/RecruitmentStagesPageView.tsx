"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import StagesForm from "@/components/settings/StagesForm";

import {
  RecruitmentStagesHeader,
  RecruitmentStagesList,
  ReplacementStageDialog,
} from "./RecruitmentStagesPageViewParts";
import type {
  RecruitmentStagesPageViewProps,
  RecruitmentStageFormValues,
} from "./RecruitmentStagesPageViewTypes";

export type { RecruitmentStageFormValues };

export function RecruitmentStagesPageView({
  showLogoOnly,
  stages,
  isLoading,
  fetchError,
  isModalOpen,
  editingStage,
  stageToDelete,
  isReplacementModalOpen,
  replacementStageName,
  onOpenModal,
  onCloseModal,
  onSubmitStage,
  onAttemptDelete,
  onDragEnd,
  onReplacementOpenChange,
  onReplacementStageNameChange,
  onConfirmDeleteWithReplacement,
}: RecruitmentStagesPageViewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <RecruitmentStagesHeader
        showLogoOnly={showLogoOnly}
        onOpenModal={onOpenModal}
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full min-h-0 pr-4">
              <div className="space-y-6">
                <RecruitmentStagesList
                  stages={stages}
                  isLoading={isLoading}
                  fetchError={fetchError}
                  onOpenModal={onOpenModal}
                  onAttemptDelete={onAttemptDelete}
                  onDragEnd={onDragEnd}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <StagesForm
        open={isModalOpen}
        stage={editingStage}
        onClose={onCloseModal}
        onSubmit={onSubmitStage}
      />

      <ReplacementStageDialog
        stages={stages}
        stageToDelete={stageToDelete}
        isReplacementModalOpen={isReplacementModalOpen}
        replacementStageName={replacementStageName}
        onReplacementOpenChange={onReplacementOpenChange}
        onReplacementStageNameChange={onReplacementStageNameChange}
        onConfirmDeleteWithReplacement={onConfirmDeleteWithReplacement}
      />
    </div>
  );
}
