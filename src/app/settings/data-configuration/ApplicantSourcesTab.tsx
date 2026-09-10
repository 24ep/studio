"use client";

import ApplicantSourceAlertDialog from "@/components/settings/ApplicantSourceAlertDialog";
import ApplicantSourceModal from "@/components/settings/ApplicantSourceModal";
import { SettingsErrorState } from "@/components/settings/SettingsTabState";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  ApplicantSourcesTabContent,
  ApplicantSourcesTabHeader,
} from "./ApplicantSourcesTabParts";
import { useApplicantSourcesTab } from "./use-applicant-sources-tab";

export function ApplicantSourcesTab() {
  const tab = useApplicantSourcesTab();

  if (tab.fetchError) {
    return <SettingsErrorState message={tab.fetchError} />;
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <ApplicantSourcesTabHeader
          appKitLoad={tab.appKitLoad}
          onCreate={tab.openCreateModal}
          onLoadFromAppKit={tab.handleLoadFromAppKit}
        />
        <ApplicantSourcesTabContent
          sources={tab.sources}
          isLoading={tab.isLoading}
          onCreate={tab.openCreateModal}
          onEdit={tab.openEditModal}
          onDelete={tab.setSourceToDelete}
          onDragEnd={tab.handleDragEnd}
        />
      </div>

      <ApplicantSourceModal
        open={tab.isModalOpen}
        onClose={tab.closeModal}
        onSubmit={tab.handleModalSubmit}
        source={tab.editingSource}
      />
      <ApplicantSourceAlertDialog
        open={!!tab.sourceToDelete}
        onConfirm={tab.handleDeleteSelected}
        onCancel={() => tab.setSourceToDelete(null)}
        source={tab.sourceToDelete}
      />
    </ScrollArea>
  );
}
