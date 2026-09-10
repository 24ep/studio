"use client";

import { useSession } from 'next-auth/react';

import type { Applicant } from '@/lib/types';

import { ApplicantClassicKanbanColumns } from './ApplicantClassicKanbanColumns';
import { ApplicantColumnMatrixKanbanView } from './ApplicantColumnMatrixKanbanView';
import { ApplicantGroupedRowKanbanView } from './ApplicantGroupedRowKanbanView';
import { ApplicantKanbanCardStack } from './ApplicantKanbanCardStack';
import { ApplicantKanbanEmptyState, ApplicantKanbanLoadingState } from './ApplicantKanbanViewStates';
import { SingleRowApplicantView } from './ApplicantSingleRowApplicantView';
import {
  buildApplicantKanbanCellLayout,
  buildApplicantKanbanLayoutConfig,
  filterApplicantsByKanbanFieldValue,
  getApplicantFlexibleKanbanRenderMode,
} from './applicant-kanban-layout-utils';
import { useApplicantKanbanDragDrop } from './hooks/use-applicant-kanban-drag-drop';
import type { ApplicantKanbanViewProps } from './ApplicantKanbanViewTypes';

export function ApplicantFlexibleKanbanContent({
  applicants,
  recruiters,
  onMoveApplicant,
  onCardClick,
  rowField = 'status',
  columnField = 'recruiterId',
  visibleFields = ['name', 'email', 'status', 'fitScore'],
  visibleRowValues = [],
  visibleColumnValues = [],
  isLoading = false,
}: ApplicantKanbanViewProps) {
  const { data: session } = useSession();
  const isImpersonating = Boolean(session?.user?.impersonatedUserId || session?.user?.impersonatedRole);
  const layoutConfig = buildApplicantKanbanLayoutConfig({
    applicants,
    rowField,
    columnField,
    visibleRowValues,
    visibleColumnValues,
  });
  const dragDrop = useApplicantKanbanDragDrop({
    rowField,
    columnField,
    isColumnBased: layoutConfig.isColumnBased,
    isRowBased: layoutConfig.isRowBased,
    onMoveApplicant,
  });
  const handleCardClick = (applicant: Applicant) => onCardClick?.(applicant);

  if (isLoading) return <ApplicantKanbanLoadingState />;
  if (!applicants || applicants.length === 0) return <ApplicantKanbanEmptyState framed />;

  const renderMode = getApplicantFlexibleKanbanRenderMode({
    rowField,
    columnField,
    isColumnBased: layoutConfig.isColumnBased,
    showSingleRow: layoutConfig.showSingleRow,
    effectiveColumnValues: layoutConfig.effectiveColumnValues,
  });

  if (renderMode === 'classic-columns') {
    return (
      <ApplicantClassicKanbanColumns
        applicants={applicants}
        columnField={columnField}
        effectiveColumnField={layoutConfig.effectiveColumnField}
        effectiveColumnValues={layoutConfig.effectiveColumnValues}
        visibleColumnValues={visibleColumnValues}
        visibleFields={visibleFields}
        recruiters={recruiters}
        draggedApplicantId={dragDrop.draggedApplicant?.id}
        dragOverRow={dragDrop.dragOverRow}
        dragOverColumn={dragDrop.dragOverColumn}
        isImpersonating={isImpersonating}
        onCardClick={handleCardClick}
        onDragStart={dragDrop.handleDragStart}
        onDragEnd={dragDrop.handleDragEnd}
        onDragOver={dragDrop.handleDragOver}
        onDragLeave={dragDrop.handleDragLeave}
        onDrop={dragDrop.handleDrop}
      />
    );
  }

  if (renderMode === 'card-stack') {
    return (
      <div className="w-full h-[calc(100%-200px)] min-h-[400px] bg-muted/30 rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
        <ApplicantKanbanCardStack
          applicants={applicants}
          draggedApplicantId={dragDrop.draggedApplicant?.id}
          className="flex flex-row flex-wrap gap-3"
          onCardClick={handleCardClick}
          onDragStart={dragDrop.handleDragStart}
          onDragEnd={dragDrop.handleDragEnd}
          visibleFields={visibleFields}
          recruiters={recruiters}
        />
      </div>
    );
  }

  if (renderMode === 'single-column-row') {
    const columnValue = layoutConfig.effectiveColumnValues[0];
    const columnApplicants = filterApplicantsByKanbanFieldValue(applicants, columnField, columnValue);

    return (
      <div className="w-full h-[calc(100%-200px)] min-h-[400px] bg-muted/30 rounded-lg p-4 flex flex-col items-center justify-center overflow-y-auto">
        <SingleRowApplicantView
          applicants={columnApplicants}
          onCardClick={onCardClick}
          visibleFields={visibleFields}
          recruiters={recruiters}
        />
      </div>
    );
  }

  if (renderMode === 'matrix') {
    return (
      <ApplicantColumnMatrixKanbanView
        columnValues={layoutConfig.effectiveColumnValues}
        rowValues={layoutConfig.rowValuesToShow}
        effectiveColumnField={layoutConfig.effectiveColumnField}
        kanbanCellLayout={buildApplicantKanbanCellLayout({
          applicants,
          rowValues: layoutConfig.rowValuesToShow,
          columnValues: layoutConfig.effectiveColumnValues,
          rowField,
          columnField,
        })}
        draggedApplicantId={dragDrop.draggedApplicant?.id}
        dragOverRow={dragDrop.dragOverRow}
        dragOverColumn={dragDrop.dragOverColumn}
        visibleFields={visibleFields}
        recruiters={recruiters}
        onCardClick={handleCardClick}
        onDragStart={dragDrop.handleDragStart}
        onDragEnd={dragDrop.handleDragEnd}
        onDragOver={dragDrop.handleDragOver}
        onDrop={dragDrop.handleDrop}
      />
    );
  }

  return (
    <ApplicantGroupedRowKanbanView
      applicants={applicants}
      draggedApplicantId={dragDrop.draggedApplicant?.id}
      dragOverRow={dragDrop.dragOverRow}
      recruiters={recruiters}
      rowField={rowField}
      rowValuesToShow={layoutConfig.rowValuesToShow}
      visibleFields={visibleFields}
      onCardClick={handleCardClick}
      onDragEnd={dragDrop.handleDragEnd}
      onDragOver={dragDrop.handleDragOver}
      onDragStart={dragDrop.handleDragStart}
      onDrop={dragDrop.handleDrop}
    />
  );
}
