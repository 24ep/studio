"use client";

import { Badge } from '@/components/ui/badge';
import type { Applicant, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

import { ApplicantKanbanCardStack } from './ApplicantKanbanCardStack';
import { getGroupedRowApplicants } from './applicant-kanban-layout-utils';

interface ApplicantGroupedRowKanbanViewProps {
  applicants: Applicant[];
  draggedApplicantId?: string;
  dragOverRow: string | null;
  recruiters?: UserProfile[];
  rowField: string;
  rowValuesToShow: string[];
  visibleFields: string[];
  onCardClick: (applicant: Applicant) => void;
  onDragEnd: () => void;
  onDragOver: (rowValue: string, columnValue: string, event: React.DragEvent) => void;
  onDragStart: (applicant: Applicant) => void;
  onDrop: (rowValue: string, columnValue: string) => void;
}

export function ApplicantGroupedRowKanbanView({
  applicants,
  draggedApplicantId,
  dragOverRow,
  recruiters,
  rowField,
  rowValuesToShow,
  visibleFields,
  onCardClick,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
}: ApplicantGroupedRowKanbanViewProps) {
  return (
    <div className="w-full h-[calc(100%-200px)] min-h-[400px] bg-muted/30 rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
      <div className="grid grid-cols-1 gap-4">
        {rowValuesToShow.map(rowValue => (
          <ApplicantGroupedRow
            key={rowValue}
            applicants={getGroupedRowApplicants(applicants, rowField, rowValue)}
            draggedApplicantId={draggedApplicantId}
            isDragOver={dragOverRow === rowValue}
            recruiters={recruiters}
            rowValue={rowValue}
            visibleFields={visibleFields}
            onCardClick={onCardClick}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragStart={onDragStart}
            onDrop={onDrop}
          />
        ))}
      </div>
    </div>
  );
}

function ApplicantGroupedRow({
  applicants,
  draggedApplicantId,
  isDragOver,
  recruiters,
  rowValue,
  visibleFields,
  onCardClick,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
}: {
  applicants: Applicant[];
  draggedApplicantId?: string;
  isDragOver: boolean;
  recruiters?: UserProfile[];
  rowValue: string;
  visibleFields: string[];
  onCardClick: (applicant: Applicant) => void;
  onDragEnd: () => void;
  onDragOver: (rowValue: string, columnValue: string, event: React.DragEvent) => void;
  onDragStart: (applicant: Applicant) => void;
  onDrop: (rowValue: string, columnValue: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-row items-center gap-4 transition-all duration-200 border border-border rounded-lg p-4 bg-card shadow-sm',
        isDragOver && 'ring-2 ring-primary/60 bg-primary/5'
      )}
      onDragOver={(event) => onDragOver(rowValue, 'default', event)}
      onDrop={() => onDrop(rowValue, 'default')}
    >
      <div className="w-40 flex-shrink-0 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="font-semibold text-base capitalize text-foreground">{rowValue}</span>
        </div>
        <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full">
          {applicants.length} applicants
        </Badge>
      </div>
      <div className="flex-1 min-h-[80px]">
        <ApplicantKanbanCardStack
          applicants={applicants}
          draggedApplicantId={draggedApplicantId}
          className="flex flex-row flex-wrap gap-3"
          onCardClick={onCardClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          visibleFields={visibleFields}
          recruiters={recruiters}
        />
      </div>
    </div>
  );
}
