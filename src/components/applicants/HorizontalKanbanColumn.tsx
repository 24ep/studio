"use client";

import { Card } from '@/components/ui/card';
import type { Applicant, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  HorizontalKanbanApplicantStack,
  HorizontalKanbanColumnHeader,
  HorizontalKanbanDropOverlay,
  HorizontalKanbanEmptyColumn,
} from './HorizontalKanbanColumnParts';

export function HorizontalKanbanColumn({
  column,
  applicants,
  draggedApplicant,
  dragOverStage,
  isDragging,
  columnField,
  visibleFields,
  recruiters,
  onCardClick,
  onDragStart,
  onDragEnd,
  onDragEnterColumn,
  onDragOverColumn,
  onDragLeaveColumn,
  onDropColumn,
  getColumnValue,
}: {
  column: string;
  applicants: Applicant[];
  draggedApplicant: Applicant | null;
  dragOverStage: string | null;
  isDragging: boolean;
  columnField: string;
  visibleFields: string[];
  recruiters?: UserProfile[];
  onCardClick?: (applicant: Applicant) => void;
  onDragStart: (applicant: Applicant) => void;
  onDragEnd: () => void;
  onDragEnterColumn: (column: string) => void;
  onDragOverColumn: (column: string, event: React.DragEvent) => void;
  onDragLeaveColumn: (event: React.DragEvent) => void;
  onDropColumn: (column: string, event: React.DragEvent) => void;
  getColumnValue: (applicant: Applicant) => string;
}) {
  const isDragOver = dragOverStage === column;
  const isCurrentColumn = draggedApplicant && getColumnValue(draggedApplicant) === column;

  return (
    <div className="flex-shrink-0 w-80" style={{ minWidth: '320px' }}>
      <Card className={cn(
        "flex flex-col h-full shadow-sm border border-border bg-card transition-all duration-200",
        isDragOver && !isCurrentColumn && "ring-2 ring-primary ring-opacity-50 bg-primary/5",
        isCurrentColumn && isDragging && "opacity-50"
      )}>
        <HorizontalKanbanColumnHeader
          column={column}
          columnField={columnField}
          applicantCount={applicants.length}
        />
        <div
          className={cn(
            "flex-1 min-h-0 p-4 space-y-3 transition-all duration-200 relative",
            isDragOver && !isCurrentColumn && "bg-primary/5"
          )}
          onDragOver={(event) => onDragOverColumn(column, event)}
          onDragLeave={onDragLeaveColumn}
          onDrop={(event) => onDropColumn(column, event)}
          onDragEnter={(event) => {
            event.preventDefault();
            onDragEnterColumn(column);
          }}
        >
          {isDragOver && !isCurrentColumn && <HorizontalKanbanDropOverlay column={column} />}
          {applicants.length > 0 ? (
            <HorizontalKanbanApplicantStack
              applicants={applicants}
              draggedApplicant={draggedApplicant}
              visibleFields={visibleFields}
              columnField={columnField}
              recruiters={recruiters}
              onCardClick={onCardClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ) : (
            <HorizontalKanbanEmptyColumn
              column={column}
              columnField={columnField}
              isActiveDropTarget={Boolean(isDragOver && !isCurrentColumn)}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
