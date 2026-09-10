"use client";

import React from 'react';

import type { Position } from '@/lib/types';

import { PositionsBulkActionsBar } from './PositionsBulkActionsBar';
import { PositionsDesktopTable } from './PositionsDesktopTable';
import { PositionsEmptyState } from './PositionsEmptyState';
import { PositionsMobileListSection } from './PositionsMobileListSection';
import { PositionsPaginationControls } from './PositionsPaginationControls';
import type {
  PositionRecruiterOption,
  PositionSortDirection,
} from './position-page-utils';

type PositionHeadcount = {
  total: number;
  vacant: number;
  filled: number;
};

interface PositionsListContentProps {
  positions: Position[];
  sortedPositions: Position[];
  isMobile: boolean;
  isLoading: boolean;
  isTableLoading: boolean;
  isJobMatchEnabled: boolean;
  isLoadingHeadcount: boolean;
  emptyStateMessage: string;
  showAddFirstPositionButton: boolean;
  mobileDisplayCount: number;
  onMobileDisplayCountChange: React.Dispatch<React.SetStateAction<number>>;
  pullToRefreshRef: React.RefObject<HTMLDivElement>;
  pullProgress: number;
  isRefreshing: boolean;
  headcountData: Record<string, PositionHeadcount>;
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  selectedIds: string[];
  allSelected: boolean;
  sortColumn: string | null;
  sortDirection: PositionSortDirection;
  openMenu: string | null;
  availableRecruiter: PositionRecruiterOption[];
  canAssignPositionRecruiter: boolean;
  assigningRecruiter: string | null;
  onAddPosition: () => void;
  onMobilePositionClick: (positionId: string) => void;
  onMobileEditClick: (positionId: string, event: React.MouseEvent) => void;
  onMobileDeleteClick: (position: Position, event: React.MouseEvent) => void;
  onUpdateMatchCriteria: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onSelectAll: (checked: boolean) => void;
  onRowSelect: (id: string, checked: boolean) => void;
  onOpenMenuChange: (menu: string | null) => void;
  onSort: (column: string | null, direction?: PositionSortDirection) => void;
  onViewPosition: (positionId: string) => void;
  onEditPosition: (positionId: string) => void;
  onDeletePosition: (position: Position) => void;
  onAssignRecruiter: (positionId: string, recruiterId: string | null) => Promise<void>;
  onResetAssigning: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function PositionsListContent({
  positions,
  sortedPositions,
  isMobile,
  isLoading,
  isTableLoading,
  isJobMatchEnabled,
  isLoadingHeadcount,
  emptyStateMessage,
  showAddFirstPositionButton,
  mobileDisplayCount,
  onMobileDisplayCountChange,
  pullToRefreshRef,
  pullProgress,
  isRefreshing,
  headcountData,
  page,
  pageSize,
  totalPages,
  total,
  selectedIds,
  allSelected,
  sortColumn,
  sortDirection,
  openMenu,
  availableRecruiter,
  canAssignPositionRecruiter,
  assigningRecruiter,
  onAddPosition,
  onMobilePositionClick,
  onMobileEditClick,
  onMobileDeleteClick,
  onUpdateMatchCriteria,
  onBulkDelete,
  onClearSelection,
  onSelectAll,
  onRowSelect,
  onOpenMenuChange,
  onSort,
  onViewPosition,
  onEditPosition,
  onDeletePosition,
  onAssignRecruiter,
  onResetAssigning,
  onPageChange,
  onPageSizeChange,
}: PositionsListContentProps) {
  return (
    <div className="positions-table-container flex flex-1 flex-col overflow-hidden">
      {!isLoading && positions.length === 0 ? (
        <PositionsEmptyState
          message={emptyStateMessage}
          showAddFirstPositionButton={showAddFirstPositionButton}
          onAddPosition={onAddPosition}
        />
      ) : isMobile ? (
        <PositionsMobileListSection
          positions={sortedPositions}
          visibleCount={mobileDisplayCount}
          onVisibleCountChange={onMobileDisplayCountChange}
          pullToRefreshRef={pullToRefreshRef}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
          headcountData={headcountData}
          isLoadingHeadcount={isLoadingHeadcount}
          isJobMatchEnabled={isJobMatchEnabled}
          page={page}
          pageSize={pageSize}
          onPositionClick={onMobilePositionClick}
          onEditClick={onMobileEditClick}
          onDeleteClick={onMobileDeleteClick}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <PositionsBulkActionsBar
            selectedCount={selectedIds.length}
            onUpdateMatchCriteria={onUpdateMatchCriteria}
            onDelete={onBulkDelete}
            onClear={onClearSelection}
          />

          <PositionsDesktopTable
            positions={sortedPositions}
            isLoading={isLoading}
            isTableLoading={isTableLoading}
            isJobMatchEnabled={isJobMatchEnabled}
            page={page}
            pageSize={pageSize}
            selectedIds={selectedIds}
            allSelected={allSelected}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            openMenu={openMenu}
            isLoadingHeadcount={isLoadingHeadcount}
            headcountData={headcountData}
            availableRecruiter={availableRecruiter}
            canAssignPositionRecruiter={canAssignPositionRecruiter}
            assigningRecruiter={assigningRecruiter}
            onSelectAll={onSelectAll}
            onRowSelect={onRowSelect}
            onOpenMenuChange={onOpenMenuChange}
            onSort={onSort}
            onViewPosition={onViewPosition}
            onEditPosition={onEditPosition}
            onDeletePosition={onDeletePosition}
            onAssignRecruiter={onAssignRecruiter}
            onResetAssigning={onResetAssigning}
          />

          <PositionsPaginationControls
            isMobile={isMobile}
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
