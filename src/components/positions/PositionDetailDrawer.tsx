"use client";

import './position-detail-drawer.css';
import { PositionDetailApplicantModal } from './PositionDetailApplicantModal';
import { PositionDetailDrawerContent } from './PositionDetailDrawerContent';
import { PositionDetailDrawerShell } from './PositionDetailDrawerShell';
import { PositionDetailPageView } from './PositionDetailPageView';
import { usePositionDetailDrawerController } from './hooks/use-position-detail-drawer-controller';
import type { PositionDetailDrawerContentProps } from './PositionDetailDrawerContentTypes';

interface PositionDetailDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  positionId: string | null;
  initialEditMode?: boolean;
  preventClose?: boolean; // Prevent closing via overlay click or ESC key
  presentation?: 'drawer' | 'page';
}

export function PositionDetailDrawer({ isOpen, onOpenChange, positionId, initialEditMode = false, preventClose = false, presentation = 'drawer' }: PositionDetailDrawerProps) {
  const drawer = usePositionDetailDrawerController({
    initialEditMode,
    isOpen,
    onOpenChange,
    positionId,
  });
  const { applicantState, baseData, editActions } = drawer;
  const contentProps: PositionDetailDrawerContentProps = {
    activeTab: drawer.activeTab,
    activeApplicantTab: applicantState.activeApplicantTab,
    position: baseData.position,
    positionId,
    isMobile: drawer.isMobile,
    isJobMatchEnabled: drawer.isJobMatchEnabled,
    isEditMode: drawer.isEditMode,
    isSaving: editActions.isSaving,
    isDrawerReady: baseData.isDrawerReady,
    isLoadingLevels: drawer.isLoadingLevels,
    isGeneratingDescription: editActions.isGeneratingDescription,
    positionLevels: drawer.positionLevels,
    grades: baseData.grades,
    availableRecruiters: baseData.availableRecruiters,
    availableSources: baseData.availableSources,
    recruitmentStages: baseData.recruitmentStages,
    form: drawer.form,
    defaultMatchCriteria: editActions.defaultMatchCriteria,
    headcountsTotal: baseData.headcountsTotal,
    allApplicantsTotal: applicantState.allApplicantsTotal,
    appliedApplicantsTotal: applicantState.appliedApplicantsTotal,
    appliedApplicantsCount: applicantState.appliedApplicantsCount,
    appliedApplicants: applicantState.appliedApplicants,
    sortedAppliedApplicants: applicantState.sortedAppliedApplicants,
    appliedApplicantsSearchTerm: applicantState.appliedApplicantsSearchTerm,
    appliedApplicantsSortColumn: applicantState.appliedApplicantsSortColumn,
    appliedApplicantsSortDirection: applicantState.appliedApplicantsSortDirection,
    appliedApplicantsOpenMenu: applicantState.appliedApplicantsOpenMenu,
    appliedApplicantsPage: applicantState.appliedApplicantsPage,
    appliedApplicantsPageSize: applicantState.appliedApplicantsPageSize,
    potentialApplicants: applicantState.potentialApplicants,
    sortedPotentialApplicants: applicantState.sortedPotentialApplicants,
    potentialApplicantsSearchTerm: applicantState.potentialApplicantsSearchTerm,
    potentialApplicantsSortColumn: applicantState.potentialApplicantsSortColumn,
    potentialApplicantsSortDirection: applicantState.potentialApplicantsSortDirection,
    potentialApplicantsOpenMenu: applicantState.potentialApplicantsOpenMenu,
    potentialApplicantsPage: applicantState.potentialApplicantsPage,
    potentialApplicantsPageSize: applicantState.potentialApplicantsPageSize,
    potentialApplicantsTotal: applicantState.potentialApplicantsTotal,
    filteredApplicants: applicantState.filteredApplicants,
    applicantFilters: applicantState.applicantFilters,
    isAiSearchingApplicants: applicantState.isAiSearchingApplicants,
    stageNames: applicantState.stageNames,
    adUsers: drawer.adUsers,
    adUsersError: drawer.adUsersError,
    isLoadingAdUsers: drawer.isLoadingAdUsers,
    onTabChange: drawer.setActiveTab,
    onActiveApplicantTabChange: applicantState.setActiveApplicantTab,
    onEdit: editActions.handleEdit,
    onCancel: editActions.handleCancel,
    onSave: editActions.handleSave,
    onGenerateJobDescription: editActions.generateJobDescription,
    onUseDefaultCriteria: editActions.useDefaultCriteria,
    onCustomFieldChange: baseData.handleCustomFieldChange,
    onHeadcountChange: baseData.fetchHeadcountCount,
    onAppliedApplicantsSearchChange: applicantState.setAppliedApplicantsSearchTerm,
    onAppliedApplicantsSort: applicantState.handleAppliedApplicantsSort,
    onAppliedApplicantsOpenMenuChange: applicantState.setAppliedApplicantsOpenMenu,
    onAppliedApplicantsPageChange: applicantState.setAppliedApplicantsPage,
    onAppliedApplicantsPageSizeChange: applicantState.setAppliedApplicantsPageSize,
    onAppliedApplicantPinToggle: applicantState.handleAppliedApplicantPinToggle,
    onPotentialApplicantsSearchChange: applicantState.setPotentialApplicantsSearchTerm,
    onPotentialApplicantsSort: applicantState.handlePotentialApplicantsSort,
    onPotentialApplicantsOpenMenuChange: applicantState.setPotentialApplicantsOpenMenu,
    onPotentialApplicantsPageChange: applicantState.setPotentialApplicantsPage,
    onPotentialApplicantsPageSizeChange: applicantState.setPotentialApplicantsPageSize,
    onPotentialApplicantPinToggle: applicantState.handlePotentialApplicantPinToggle,
    onApplicantClick: drawer.handleApplicantClick,
    onApplicantFilterChange: applicantState.setApplicantFilters,
    onAiSearch: applicantState.handlePositionApplicantAiSearch,
    onClearFilters: applicantState.handleClearApplicantFilters,
    onRetryAdUsers: drawer.fetchAdUsers,
  };

  if (presentation === 'page') {
    return (
      <PositionDetailPageView controller={drawer} contentProps={contentProps} />
    );
  }

  return (
    <>
      <PositionDetailDrawerShell
        hasMounted={drawer.hasMounted}
        isMobile={drawer.isMobile}
        isOpen={isOpen}
        position={baseData.position}
        isLoading={baseData.isLoading}
        fetchError={baseData.fetchError}
        preventClose={preventClose}
        isApplicantModalOpen={drawer.isApplicantModalOpen}
        onOpenChange={drawer.handleSheetOpenChange}
        onManualClose={drawer.handleManualClose}
      >
        <PositionDetailDrawerContent {...contentProps} />
      </PositionDetailDrawerShell>

      <PositionDetailApplicantModal
        isOpen={drawer.isApplicantModalOpen}
        onClose={drawer.closeApplicantModal}
        onRefresh={drawer.refreshApplicantModal}
        selectedApplicantId={drawer.selectedApplicantId}
      />
    </>
  );
}
