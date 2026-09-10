"use client";

import type React from 'react';
import { PlusIcon as Plus } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import type { Applicant, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getMultiRecruiterStageApplicants } from './ApplicantMultiRecruiterKanbanUtils';
import { MultiRecruiterApplicantCard } from './ApplicantMultiRecruiterCard';

interface MultiRecruiterStageSectionProps {
  applicants: Applicant[];
  stage: string;
  recruiter: UserProfile;
  draggedApplicant: Applicant | null;
  dragOverStage: string | null;
  dragOverRecruiter: UserProfile | null;
  onCardClick?: (applicant: Applicant) => void;
  onDragStart: (applicant: Applicant) => void;
  onDragEnd: () => void;
  onDragOver: (stage: string, recruiter: UserProfile, event: React.DragEvent) => void;
  onDrop: (stage: string, recruiter: UserProfile) => void;
}

export function MultiRecruiterStageSection({
  applicants,
  stage,
  recruiter,
  draggedApplicant,
  dragOverStage,
  dragOverRecruiter,
  onCardClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: MultiRecruiterStageSectionProps) {
  const stageApplicants = getMultiRecruiterStageApplicants(applicants, stage, recruiter.id);
  const isDragTarget = dragOverStage === stage && dragOverRecruiter?.id === recruiter.id;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{stage}</span>
        <Badge variant="secondary" className="text-xs">
          {stageApplicants.length}
        </Badge>
      </div>
      <div
        className={cn(
          "min-h-[80px] p-2 rounded-lg border-2 border-dashed border-muted transition-all duration-200",
          isDragTarget && "border-primary bg-primary/5"
        )}
        onDragOver={(event) => onDragOver(stage, recruiter, event)}
        onDrop={() => onDrop(stage, recruiter)}
      >
        {stageApplicants.length > 0 ? (
          <div className="space-y-2">
            {stageApplicants.map((applicant) => (
              <MultiRecruiterApplicantCard
                key={applicant.id}
                applicant={applicant}
                isDragging={draggedApplicant?.id === applicant.id}
                onCardClick={onCardClick}
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        ) : (
          <EmptyStageDropTarget />
        )}
      </div>
    </div>
  );
}

function EmptyStageDropTarget() {
  return (
    <div className="flex items-center justify-center h-16">
      <div className="text-center">
        <Plus className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Drop here</p>
      </div>
    </div>
  );
}
