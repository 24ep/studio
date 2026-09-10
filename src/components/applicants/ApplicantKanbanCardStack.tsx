"use client";

import type { Applicant, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ApplicantKanbanCard } from './ApplicantKanbanCard';

type ApplicantKanbanCardStackProps = {
  applicants: Applicant[];
  draggedApplicantId?: string;
  visibleFields: string[];
  recruiters?: UserProfile[];
  className?: string;
  itemClassName?: string;
  onCardClick: (applicant: Applicant) => void;
  onDragStart: (applicant: Applicant) => void;
  onDragEnd: () => void;
};

export function ApplicantKanbanCardStack({
  applicants,
  draggedApplicantId,
  visibleFields,
  recruiters,
  className = 'space-y-2',
  itemClassName,
  onCardClick,
  onDragStart,
  onDragEnd,
}: ApplicantKanbanCardStackProps) {
  return (
    <div className={className}>
      {applicants.map(applicant => (
        <div
          key={applicant.id}
          className={cn(
            'group w-full',
            itemClassName,
            draggedApplicantId === applicant.id && 'opacity-60 scale-95'
          )}
        >
          <ApplicantKanbanCard
            applicant={applicant}
            isDragged={draggedApplicantId === applicant.id}
            onClick={() => onCardClick(applicant)}
            onDragStart={() => onDragStart(applicant)}
            onDragEnd={onDragEnd}
            visibleFields={visibleFields}
            recruiters={recruiters}
          />
        </div>
      ))}
    </div>
  );
}
