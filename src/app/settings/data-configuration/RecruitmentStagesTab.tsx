"use client";

import { DownloadCloud, Loader2, PlusCircle } from "lucide-react";

import StagesForm from "@/components/settings/StagesForm";
import { RecruitmentStageReplacementDialog } from "@/components/settings/RecruitmentStageReplacementDialog";
import {
  SettingsErrorState,
  SettingsPermissionDenied,
} from "@/components/settings/SettingsTabState";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { RecruitmentStagesList } from "./RecruitmentStagesList";
import { useRecruitmentStagesTab } from "./use-recruitment-stages-tab";

export function RecruitmentStagesTab() {
  const tab = useRecruitmentStagesTab();
  const loadingForDevelopment =
    tab.isImportingAppKit && tab.appKitLoad?.environment === "development" ? tab.appKitLoad : null;
  const loadingForProduction =
    tab.isImportingAppKit && tab.appKitLoad?.environment === "production" ? tab.appKitLoad : null;

  if (!tab.canManageStages) {
    return (
      <SettingsPermissionDenied
        subject="recruitment stages"
        permission="RECRUITMENT_STAGES_EDIT"
      />
    );
  }

  if (tab.fetchError) {
    return <SettingsErrorState message={tab.fetchError} />;
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Recruitment Stages</h2>
            <p className="text-sm text-muted-foreground">
              Manage the stages in your recruitment pipeline. Most stages can be deleted,
              except those with core business logic dependencies.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={tab.isImportingAppKit}
              onClick={() => tab.handleLoadFromAppKit("development")}
            >
              {loadingForDevelopment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
              {loadingForDevelopment
                ? `${loadingForDevelopment.percent}% · ${loadingForDevelopment.message}`
                : "Load development stages"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={tab.isImportingAppKit}
              onClick={() => tab.handleLoadFromAppKit("production")}
            >
              {loadingForProduction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
              {loadingForProduction
                ? `${loadingForProduction.percent}% · ${loadingForProduction.message}`
                : "Load live stages"}
            </Button>
            <Button onClick={() => tab.openModal()} variant="default">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Stage
            </Button>
          </div>
        </div>

        <RecruitmentStagesList
          stages={tab.stages}
          isLoading={tab.isLoading}
          onAttemptDelete={tab.attemptDeleteStage}
          onDragEnd={tab.handleDragEnd}
          onOpenModal={tab.openModal}
        />
      </div>

      <StagesForm
        open={tab.isModalOpen}
        stage={tab.editingStage}
        onClose={tab.closeModal}
        onSubmit={tab.submitStage}
      />

      <RecruitmentStageReplacementDialog
        open={tab.isReplacementModalOpen}
        stages={tab.stages}
        stageToDelete={tab.stageToDelete}
        replacementStageName={tab.replacementStageName}
        onOpenChange={tab.handleReplacementOpenChange}
        onReplacementStageNameChange={tab.setReplacementStageName}
        onConfirm={tab.confirmDeleteWithReplacement}
      />
    </ScrollArea>
  );
}
