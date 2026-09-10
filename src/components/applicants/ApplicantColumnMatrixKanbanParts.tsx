import type { DragEvent } from 'react';
import { PlusIcon as Plus } from '@heroicons/react/24/outline';
import type { Applicant, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ApplicantKanbanCardStack } from './ApplicantKanbanCardStack';
import type { buildApplicantKanbanCellLayout } from './applicant-kanban-layout-utils';

export type ApplicantKanbanCellLayout = ReturnType<typeof buildApplicantKanbanCellLayout>;

interface ApplicantStackControls {
  draggedApplicantId?: string;
  visibleFields: string[];
  recruiters?: UserProfile[];
  onCardClick: (applicant: Applicant) => void;
  onDragStart: (applicant: Applicant) => void;
  onDragEnd: () => void;
}

interface ApplicantMatrixColumnProps extends ApplicantStackControls {
  columnValue: string;
  rowValues: string[];
  effectiveColumnField: string | null;
  kanbanCellLayout: ApplicantKanbanCellLayout;
  dragOverRow: string | null;
  dragOverColumn: string | null;
  onDragOver: (rowValue: string, columnValue: string, event: DragEvent) => void;
  onDrop: (rowValue: string, columnValue: string) => void;
}

interface UnmatchedApplicantMatrixColumnProps extends ApplicantStackControls {
  rowValues: string[];
  effectiveColumnField: string | null;
  kanbanCellLayout: ApplicantKanbanCellLayout;
}

interface ApplicantMatrixColumnHeaderProps {
  label: string;
  fieldName: string | null;
  fallback: string;
  isMuted?: boolean;
}

interface ApplicantMatrixRowProps extends ApplicantStackControls {
  label: string;
  applicants: Applicant[];
  isDragTarget?: boolean;
  onDragOver?: (event: DragEvent) => void;
  onDrop?: () => void;
}

export function ApplicantMatrixColumn({
  columnValue,
  rowValues,
  effectiveColumnField,
  kanbanCellLayout,
  dragOverRow,
  dragOverColumn,
  onDragOver,
  onDrop,
  ...stackControls
}: ApplicantMatrixColumnProps) {
  const uncategorizedApplicants = kanbanCellLayout.uncategorizedByColumn[columnValue] || [];

  return (
    <div className="flex h-full flex-col" style={{ flex: '1 1 0%' }}>
      <Card className="flex h-full flex-col border border-border bg-card shadow-sm">
        <ApplicantMatrixColumnHeader
          label={columnValue}
          fieldName={effectiveColumnField}
          fallback={columnValue?.charAt(0)?.toUpperCase() || 'C'}
        />
        <div className="min-h-0 flex-1 space-y-4 p-4">
          {rowValues.map((rowValue) => {
            const cellApplicants = kanbanCellLayout.cells[columnValue]?.[rowValue] || [];

            return (
              <ApplicantMatrixRow
                key={rowValue}
                label={rowValue}
                applicants={cellApplicants}
                isDragTarget={dragOverRow === rowValue && dragOverColumn === columnValue}
                onDragOver={(event) => onDragOver(rowValue, columnValue, event)}
                onDrop={() => onDrop(rowValue, columnValue)}
                {...stackControls}
              />
            );
          })}
          <ApplicantMatrixRow
            label="Uncategorized"
            applicants={uncategorizedApplicants}
            {...stackControls}
          />
        </div>
      </Card>
    </div>
  );
}

export function UnmatchedApplicantMatrixColumn({
  rowValues,
  effectiveColumnField,
  kanbanCellLayout,
  ...stackControls
}: UnmatchedApplicantMatrixColumnProps) {
  return (
    <div className="flex h-full flex-col" style={{ flex: '1 1 0%' }}>
      <Card className="flex h-full flex-col border border-border bg-card shadow-sm">
        <ApplicantMatrixColumnHeader
          label="Uncategorized"
          fieldName={effectiveColumnField}
          fallback="?"
          isMuted
        />
        <div className="min-h-0 flex-1 space-y-4 p-4">
          {rowValues.map((rowValue) => (
            <ApplicantMatrixRow
              key={rowValue}
              label={rowValue}
              applicants={kanbanCellLayout.unmatchedColumnCells[rowValue] || []}
              {...stackControls}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function ApplicantMatrixColumnHeader({
  label,
  fieldName,
  fallback,
  isMuted,
}: ApplicantMatrixColumnHeaderProps) {
  return (
    <CardHeader className="sticky top-16 z-10 flex-shrink-0 border-b border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={cn('text-sm', isMuted ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
            {fallback}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-sm font-semibold text-foreground">{label}</CardTitle>
          <p className="text-xs text-muted-foreground">{fieldName}</p>
        </div>
      </div>
    </CardHeader>
  );
}

function ApplicantMatrixRow({
  label,
  applicants,
  isDragTarget,
  onDragOver,
  onDrop,
  ...stackControls
}: ApplicantMatrixRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge variant="secondary" className="text-xs">
          {applicants.length}
        </Badge>
      </div>
      <div
        className={cn(
          'min-h-[80px] rounded-lg border-2 border-dashed border-muted p-2 transition-all duration-200',
          isDragTarget && 'border-primary bg-primary/5'
        )}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {applicants.length > 0 ? (
          <ApplicantKanbanCardStack
            applicants={applicants}
            {...stackControls}
          />
        ) : (
          <EmptyKanbanDropTarget />
        )}
      </div>
    </div>
  );
}

function EmptyKanbanDropTarget() {
  return (
    <div className="flex h-16 items-center justify-center">
      <div className="text-center">
        <Plus className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Drop here</p>
      </div>
    </div>
  );
}
