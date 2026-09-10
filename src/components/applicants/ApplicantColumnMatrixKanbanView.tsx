"use client";

import type { DragEvent } from 'react';
import type { Applicant, UserProfile } from '@/lib/types';
import {
  ApplicantMatrixColumn,
  UnmatchedApplicantMatrixColumn,
  type ApplicantKanbanCellLayout,
} from './ApplicantColumnMatrixKanbanParts';

interface ApplicantColumnMatrixKanbanViewProps {
  columnValues: string[];
  rowValues: string[];
  effectiveColumnField: string | null;
  kanbanCellLayout: ApplicantKanbanCellLayout;
  draggedApplicantId?: string;
  dragOverRow: string | null;
  dragOverColumn: string | null;
  visibleFields: string[];
  recruiters?: UserProfile[];
  onCardClick: (applicant: Applicant) => void;
  onDragStart: (applicant: Applicant) => void;
  onDragEnd: () => void;
  onDragOver: (rowValue: string, columnValue: string, event: DragEvent) => void;
  onDrop: (rowValue: string, columnValue: string) => void;
}

export function ApplicantColumnMatrixKanbanView({
  columnValues,
  rowValues,
  effectiveColumnField,
  kanbanCellLayout,
  draggedApplicantId,
  dragOverRow,
  dragOverColumn,
  visibleFields,
  recruiters,
  onCardClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ApplicantColumnMatrixKanbanViewProps) {
  const stackControls = {
    draggedApplicantId,
    visibleFields,
    recruiters,
    onCardClick,
    onDragStart,
    onDragEnd,
  };

  return (
    <div className="w-full h-[calc(100%-200px)] min-h-[400px] bg-muted/30 rounded-lg p-4 flex gap-4">
      {columnValues.map((columnValue) => (
        <ApplicantMatrixColumn
          key={columnValue}
          columnValue={columnValue}
          rowValues={rowValues}
          effectiveColumnField={effectiveColumnField}
          kanbanCellLayout={kanbanCellLayout}
          dragOverRow={dragOverRow}
          dragOverColumn={dragOverColumn}
          onDragOver={onDragOver}
          onDrop={onDrop}
          {...stackControls}
        />
      ))}
      <UnmatchedApplicantMatrixColumn
        rowValues={rowValues}
        effectiveColumnField={effectiveColumnField}
        kanbanCellLayout={kanbanCellLayout}
        {...stackControls}
      />
    </div>
  );
}
