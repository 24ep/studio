"use client";

import type { Applicant, ApplicantStatus, UserProfile } from '@/lib/types';
import {
  HorizontalKanbanColumn,
  HorizontalKanbanFloatingScrollButtons,
  HorizontalKanbanPositionIndicators,
  HorizontalKanbanScrollHeader,
} from './ApplicantHorizontalStageKanbanParts';
import { useHorizontalStageKanbanView } from './use-horizontal-stage-kanban-view';

interface HorizontalStageKanbanViewProps {
  applicants: Applicant[];
  statuses: ApplicantStatus[];
  recruiters?: UserProfile[];
  onMoveApplicant?: (applicant: Applicant, newValue: string) => void;
  onCardClick?: (applicant: Applicant) => void;
  rowField?: string;
  columnField?: string;
  visibleFields?: string[];
  visibleRowValues?: string[];
  visibleColumnValues?: string[];
}

const DEFAULT_VISIBLE_FIELDS = ['name', 'email', 'status', 'fitScore'];
const DEFAULT_VISIBLE_COLUMN_VALUES: string[] = [];

export function HorizontalStageKanbanView({
  applicants,
  recruiters,
  onMoveApplicant,
  onCardClick,
  columnField = 'none',
  visibleFields = DEFAULT_VISIBLE_FIELDS,
  visibleColumnValues = DEFAULT_VISIBLE_COLUMN_VALUES,
}: HorizontalStageKanbanViewProps) {
  const kanban = useHorizontalStageKanbanView({
    applicants,
    columnField,
    onMoveApplicant,
    visibleColumnValues,
  });

  return (
    <div className="w-full h-[calc(100%-200px)] min-h-[400px] bg-muted/30 rounded-lg p-4">
      {kanban.showScrollButtons && (
        <HorizontalKanbanScrollHeader
          columnCount={kanban.columnsToShow.length}
          applicantCount={applicants.length}
          scrollPosition={kanban.scrollPosition}
          onScrollLeft={kanban.handleScrollLeft}
          onScrollRight={kanban.handleScrollRight}
        />
      )}

      <div className="relative">
        <HorizontalKanbanFloatingScrollButtons
          showScrollButtons={kanban.showScrollButtons}
          scrollPosition={kanban.scrollPosition}
          onScrollLeft={kanban.handleScrollLeft}
          onScrollRight={kanban.handleScrollRight}
        />

        <div
          ref={kanban.scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onScroll={kanban.handleScroll}
        >
          {kanban.columnsToShow.map((column) => (
            <HorizontalKanbanColumn
              key={column}
              column={column}
              applicants={kanban.applicantsByColumn[column] || []}
              draggedApplicant={kanban.draggedApplicant}
              dragOverStage={kanban.dragOverStage}
              isDragging={kanban.isDragging}
              columnField={columnField}
              visibleFields={visibleFields}
              recruiters={recruiters}
              onCardClick={onCardClick}
              onDragStart={kanban.handleDragStart}
              onDragEnd={kanban.resetDragState}
              onDragEnterColumn={kanban.handleDragEnterColumn}
              onDragOverColumn={kanban.handleDragOver}
              onDragLeaveColumn={kanban.handleDragLeave}
              onDropColumn={kanban.handleDrop}
              getColumnValue={kanban.getColumnValue}
            />
          ))}
        </div>
      </div>

      {kanban.showScrollButtons && (
        <HorizontalKanbanPositionIndicators columnsToShow={kanban.columnsToShow} scrollPosition={kanban.scrollPosition} />
      )}
    </div>
  );
}
