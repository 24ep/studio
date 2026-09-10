"use client";

import type { Applicant } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  canMoveApplicantBetweenHorizontalColumns,
  getHorizontalKanbanActiveIndicatorIndex,
} from './applicant-kanban-layout-utils';

export function HorizontalKanbanPositionIndicators({
  columnsToShow,
  scrollPosition,
}: {
  columnsToShow: string[];
  scrollPosition: number;
}) {
  return (
    <div className="flex justify-center mt-4">
      <div className="flex gap-1">
        {columnsToShow.map((_, index) => {
          const activeIndex = getHorizontalKanbanActiveIndicatorIndex(scrollPosition);

          return (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === activeIndex ? "bg-primary" : "bg-muted"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export function shouldActivateHorizontalKanbanDrop({
  draggedApplicant,
  targetColumn,
  columnField,
  getColumnValue,
}: {
  draggedApplicant: Applicant | null;
  targetColumn: string;
  columnField: string;
  getColumnValue: (applicant: Applicant) => string;
}) {
  const draggedColumnValue = draggedApplicant ? getColumnValue(draggedApplicant) : undefined;

  return canMoveApplicantBetweenHorizontalColumns({
    draggedColumnValue,
    targetColumn,
    columnField,
  });
}
