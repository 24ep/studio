// src/app/settings/stages/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash } from 'lucide-react';
import { RecruitmentStagesPageView } from './RecruitmentStagesPageView';
import { useRecruitmentStagesPageController } from './use-recruitment-stages-page-controller';

export default function RecruitmentStagesPage() {
  const controller = useRecruitmentStagesPageController();

  if (controller.isInitialLoading) {
    return (
      <div className="flex w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (controller.fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Data</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">{controller.fetchError}</p>
        {controller.isPermissionError ? (
          <Button onClick={controller.goToDashboard} className="btn-hover-primary-gradient">
            Go to Dashboard
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <RecruitmentStagesPageView
      showLogoOnly={controller.showLogoOnly}
      stages={controller.stages}
      isLoading={controller.isLoading}
      fetchError={controller.fetchError}
      isModalOpen={controller.isModalOpen}
      editingStage={controller.editingStage}
      stageToDelete={controller.stageToDelete}
      isReplacementModalOpen={controller.isReplacementModalOpen}
      replacementStageName={controller.replacementStageName}
      onOpenModal={controller.handleOpenModal}
      onCloseModal={() => controller.setIsModalOpen(false)}
      onSubmitStage={controller.handleFormSubmit}
      onAttemptDelete={controller.attemptDeleteStage}
      onDragEnd={controller.handleDragEnd}
      onReplacementOpenChange={controller.handleReplacementOpenChange}
      onReplacementStageNameChange={controller.setReplacementStageName}
      onConfirmDeleteWithReplacement={controller.handleConfirmDeleteWithReplacement}
    />
  );
}
