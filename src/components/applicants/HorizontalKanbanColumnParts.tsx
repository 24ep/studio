"use client";

import { PlusIcon as Plus } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import type { Applicant, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ApplicantKanbanCard } from './ApplicantKanbanCard';
import { getHorizontalKanbanColumnSubtitle } from './applicant-kanban-layout-utils';

export function HorizontalKanbanColumnHeader({
  column,
  columnField,
  applicantCount,
}: {
  column: string;
  columnField: string;
  applicantCount: number;
}) {
  return (
    <CardHeader className="p-4 border-b border-border sticky top-16 bg-card z-10 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full transition-colors duration-200 bg-primary" />
          <div>
            <CardTitle className="text-sm font-semibold text-foreground capitalize">
              {column}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {getHorizontalKanbanColumnSubtitle(columnField)}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {applicantCount}
        </Badge>
      </div>
    </CardHeader>
  );
}

export function HorizontalKanbanDropOverlay({ column }: { column: string }) {
  return (
    <div className="absolute inset-0 border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg pointer-events-none z-10 flex items-center justify-center">
      <div className="text-center">
        <Plus className="w-8 h-8 mx-auto mb-2 text-primary" />
        <p className="text-sm font-medium text-primary">Drop here</p>
        <p className="text-xs text-primary/70">Move to {column}</p>
      </div>
    </div>
  );
}

export function HorizontalKanbanApplicantStack({
  applicants,
  draggedApplicant,
  visibleFields,
  columnField,
  recruiters,
  onCardClick,
  onDragStart,
  onDragEnd,
}: {
  applicants: Applicant[];
  draggedApplicant: Applicant | null;
  visibleFields: string[];
  columnField: string;
  recruiters?: UserProfile[];
  onCardClick?: (applicant: Applicant) => void;
  onDragStart: (applicant: Applicant) => void;
  onDragEnd: () => void;
}) {
  return (
    <div className="space-y-3">
      {applicants.map((applicant) => (
        <div
          key={applicant.id}
          className={cn(
            "group w-full transition-all duration-200",
            draggedApplicant?.id === applicant.id && "opacity-60 scale-95",
          )}
        >
          <ApplicantKanbanCard
            applicant={applicant}
            isDragged={draggedApplicant?.id === applicant.id}
            onClick={() => onCardClick?.(applicant)}
            onDragStart={() => onDragStart(applicant)}
            onDragEnd={onDragEnd}
            visibleFields={visibleFields}
            columnField={columnField}
            recruiters={recruiters}
          />
        </div>
      ))}
    </div>
  );
}

export function HorizontalKanbanEmptyColumn({
  column,
  columnField,
  isActiveDropTarget,
}: {
  column: string;
  columnField: string;
  isActiveDropTarget: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-center h-32 border-2 border-dashed rounded-lg transition-all duration-200",
      isActiveDropTarget ? "border-primary bg-primary/5" : "border-muted",
    )}>
      <div className="text-center">
        <Plus className={cn(
          "w-6 h-6 mx-auto mb-2 transition-colors duration-200",
          isActiveDropTarget ? "text-primary" : "text-muted-foreground",
        )} />
        <p className={cn(
          "text-sm transition-colors duration-200",
          isActiveDropTarget ? "text-primary font-medium" : "text-muted-foreground",
        )}>
          {isActiveDropTarget ? "Drop here" : "Drop applicants here"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {column} {columnField === 'status' ? 'stage' : 'column'}
        </p>
      </div>
    </div>
  );
}
