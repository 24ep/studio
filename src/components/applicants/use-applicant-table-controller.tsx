"use client";

import { useCallback, useMemo, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';

import { useJobMatchFeature } from '@/hooks/useJobMatchFeature';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStageColors } from '@/hooks/use-stage-colors';
import type { Applicant } from '@/lib/types';
import { splitPinnedApplicantsForTable } from './applicant-page-utils';
import {
  buildApplicantTableStageNames,
  getApplicantTableStageIds,
  getApplicantTableVisibleColumnCount,
  shouldOpenApplicantTableRowDetail,
} from './applicant-table-column-utils';
import {
  toggleApplicantPinStatus,
  toggleApplicantReadStatus,
} from './applicant-table-actions';
import { ApplicantTableRows } from './ApplicantTableRows';
import type { ApplicantTableProps } from './ApplicantTableTypes';
import { useApplicantTableAssignmentState } from './use-applicant-table-assignment-state';
import { useApplicantTableDialogState } from './use-applicant-table-dialog-state';

export function useApplicantTableController({
  allPinnedApplicants = [],
  applicants,
  availableRecruiter,
  availableSources,
  availableStages,
  canAssignSource = false,
  canDeleteApplicants = false,
  canEditApplicants = false,
  canViewDetailed = false,
  onAssignRecruiter,
  onAssignSource,
  onDeleteApplicant,
  onRefreshApplicantData,
  onToggleSelectApplicant,
  selectedApplicantIds,
  settings,
}: Pick<
  ApplicantTableProps,
  | 'allPinnedApplicants'
  | 'applicants'
  | 'availableRecruiter'
  | 'availableSources'
  | 'availableStages'
  | 'canAssignSource'
  | 'canDeleteApplicants'
  | 'canEditApplicants'
  | 'canViewDetailed'
  | 'onAssignRecruiter'
  | 'onAssignSource'
  | 'onDeleteApplicant'
  | 'onRefreshApplicantData'
  | 'onToggleSelectApplicant'
  | 'selectedApplicantIds'
  | 'settings'
>) {
  const { isJobMatchEnabled } = useJobMatchFeature();
  const router = useRouter();
  const isMobile = useIsMobile();
  const uniqueStageIds = useMemo(() => getApplicantTableStageIds(applicants), [applicants]);
  const { stageColors } = useStageColors(uniqueStageIds);
  const stageNames = useMemo(() => buildApplicantTableStageNames(availableStages), [availableStages]);
  const safeSelectedApplicantIds = selectedApplicantIds || new Set<string>();
  const visibleColumnCount = getApplicantTableVisibleColumnCount(settings);
  const applicantsByPinStatus = useMemo(
    () => splitPinnedApplicantsForTable(applicants, allPinnedApplicants),
    [allPinnedApplicants, applicants]
  );

  const dialogState = useApplicantTableDialogState({ onDeleteApplicant });
  const openApplicantDetail = useCallback((applicantId: string) => {
    router.push(`/applicants/${applicantId}`);
  }, [router]);
  const {
    assigningRecruiter,
    assigningSource,
    handleAssignRecruiter,
    handleAssignSource,
    handleResetAssigning,
  } = useApplicantTableAssignmentState({
    canAssignSource,
    onAssignRecruiter,
    onAssignSource,
  });

  const togglePin = useCallback(async (applicant: Applicant) => {
    try {
      await toggleApplicantPinStatus(applicant, onRefreshApplicantData);
    } catch (error) {
      console.error('Error toggling pin status:', error);
    }
  }, [onRefreshApplicantData]);

  const toggleRead = useCallback(async (applicant: Applicant) => {
    try {
      await toggleApplicantReadStatus(applicant, onRefreshApplicantData);
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  }, [onRefreshApplicantData]);

  const handleRowClick = useCallback((applicant: Applicant, event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!shouldOpenApplicantTableRowDetail({
      defaultPrevented: event.defaultPrevented,
      isInteractiveTarget: Boolean(target.closest('button, a, input, select, [role="button"], [data-modal], [data-dialog]')),
      isDialogTarget: Boolean(target.closest('[role="dialog"], [data-radix-dialog-content]')),
    })) {
      return;
    }

    openApplicantDetail(applicant.id);
  }, [openApplicantDetail]);

  const renderApplicantRows = useCallback((applicantList: Applicant[], startRowNumber: number) => (
    <ApplicantTableRows
      applicantList={applicantList}
      startRowNumber={startRowNumber}
      visibleColumnCount={visibleColumnCount}
      settings={settings}
      isJobMatchEnabled={isJobMatchEnabled}
      availableRecruiter={availableRecruiter}
      availableSources={availableSources}
      stageNames={stageNames}
      stageColors={stageColors}
      canEditApplicants={canEditApplicants}
      canDeleteApplicants={canDeleteApplicants}
      canViewDetailed={canViewDetailed}
      canAssignSource={canAssignSource}
      assigningRecruiter={assigningRecruiter}
      assigningSource={assigningSource}
      selectedApplicantIds={safeSelectedApplicantIds}
      onAssignRecruiter={handleAssignRecruiter}
      onAssignSource={handleAssignSource}
      onResetAssigning={handleResetAssigning}
      onOpenDetail={openApplicantDetail}
      onTogglePin={togglePin}
      onToggleRead={toggleRead}
      onDelete={dialogState.confirmDelete}
      onToggleSelectApplicant={onToggleSelectApplicant}
    />
  ), [
    assigningRecruiter,
    assigningSource,
    availableRecruiter,
    availableSources,
    canAssignSource,
    canDeleteApplicants,
    canEditApplicants,
    canViewDetailed,
    handleAssignRecruiter,
    handleAssignSource,
    handleResetAssigning,
    isJobMatchEnabled,
    onToggleSelectApplicant,
    openApplicantDetail,
    safeSelectedApplicantIds,
    settings,
    stageColors,
    stageNames,
    togglePin,
    toggleRead,
    visibleColumnCount,
  ]);

  return {
    applicantToDelete: dialogState.applicantToDelete,
    applicantsByPinStatus,
    cancelDelete: dialogState.cancelDelete,
    executeDelete: dialogState.executeDelete,
    handleRowClick,
    isJobMatchEnabled,
    isMobile,
    renderApplicantRows,
    safeSelectedApplicantIds,
    stageColors,
    stageNames,
    visibleColumnCount,
  };
}
