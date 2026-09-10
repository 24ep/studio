"use client";

import ApplicantDetailModal from "@/components/applicants/ApplicantDetailModal";
import { MyTasksBoardContent } from "@/components/tasks/MyTasksBoardContent";
import { MyTasksBoardHeader } from "@/components/tasks/MyTasksBoardHeader";
import { MyTasksCardSettingsDrawer } from "@/components/tasks/MyTasksCardSettingsDrawer";
import { NetworkDiagnostics } from "@/components/ui/network-diagnostics";
import type {
  MyTasksPageViewActions,
  MyTasksPageViewState,
} from "./MyTasksPageClientTypes";

export function MyTasksPageClientView({
  actions,
  embedded = false,
  headerLeading,
  headerTrailing,
  searchInputRef,
  state,
}: {
  actions: MyTasksPageViewActions;
  embedded?: boolean;
  headerLeading?: React.ReactNode;
  headerTrailing?: React.ReactNode;
  searchInputRef: React.RefObject<HTMLInputElement>;
  state: MyTasksPageViewState;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <MyTasksBoardHeader
        applicants={state.applicants}
        loading={state.loading}
        filters={state.filters}
        onFiltersChange={actions.setFilters}
        searchInputRef={searchInputRef}
        recruiters={state.recruiters}
        canSeeAllRecruiter={state.canSeeAllRecruiter}
        isRecruiter={state.isRecruiter}
        totalApplicants={state.totalApplicants}
        displayedApplicantsCount={state.displayedApplicants.length}
        stages={state.stages}
        selectedStages={state.selectedStages}
        isStageFilterOpen={state.isStageFilterOpen}
        onStageFilterOpenChange={actions.setIsStageFilterOpen}
        onToggleStageSelection={actions.toggleStageSelection}
        viewMode={state.viewMode}
        onViewModeChange={actions.handleViewModeChange}
        onOpenCardSettings={() => actions.setIsCardSettingsOpen(true)}
        hasNetworkError={state.hasNetworkError}
        onOpenNetworkDiagnostics={() => actions.setShowNetworkDiagnostics(true)}
        embedded={embedded}
        leadingControls={headerLeading}
        trailingControls={headerTrailing}
        onClearFilters={actions.clearFilters}
      />

      <div className="min-h-0 flex-1 bg-background">
        <MyTasksBoardContent
          loading={state.loading}
          viewMode={embedded ? "kanban" : state.viewMode}
          displayedApplicants={state.displayedApplicants}
          filteredStages={state.filteredStages}
          stageNames={state.stageNames}
          filters={state.filters}
          cardPreferences={state.memoizedPreferences}
          onMoveTask={actions.handleMoveTask}
          onApplicantOpen={actions.openApplicantDetail}
          onClearFilters={actions.clearFilters}
        />
      </div>

      {state.selectedApplicantSummary && (
        <ApplicantDetailModal
          applicantId={state.selectedApplicantSummary.id}
          open={state.isDetailModalOpen}
          onClose={actions.closeApplicantDetail}
        />
      )}

      <MyTasksCardSettingsDrawer
        open={state.isCardSettingsOpen}
        preferences={state.memoizedPreferences}
        onOpenChange={actions.setIsCardSettingsOpen}
        onUpdatePreferences={actions.updateTaskBoardPreferences}
        onResetPreferences={actions.resetTaskBoardPreferences}
      />

      {state.showNetworkDiagnostics && (
        <NetworkDiagnostics onClose={() => actions.setShowNetworkDiagnostics(false)} />
      )}
    </div>
  );
}
