"use client";

import React, { useState } from 'react';
import type { Applicant, UserProfile } from '@/lib/types';
import { MultiRecruiterColumn } from './ApplicantMultiRecruiterKanbanParts';

interface MultiRecruiterKanbanViewProps {
  applicants: Applicant[];
  stages: string[];
  recruiters: UserProfile[];
  onMoveApplicant?: (applicant: Applicant, stage: string, recruiterId: string) => void;
  onCardClick?: (applicant: Applicant) => void;
}

export function MultiRecruiterKanbanView({
  applicants,
  stages,
  recruiters,
  onMoveApplicant,
  onCardClick,
}: MultiRecruiterKanbanViewProps) {
  const [draggedApplicant, setDraggedApplicant] = useState<Applicant | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [dragOverRecruiter, setDragOverRecruiter] = useState<UserProfile | null>(null);

  const handleDragStart = (applicant: Applicant) => setDraggedApplicant(applicant);
  const handleDragEnd = () => {
    setDraggedApplicant(null);
    setDragOverStage(null);
    setDragOverRecruiter(null);
  };

  const handleDragOver = (stage: string, recruiter: UserProfile, event: React.DragEvent) => {
    event.preventDefault();
    setDragOverStage(stage);
    setDragOverRecruiter(recruiter);
  };

  const handleDrop = (stage: string, recruiter: UserProfile) => {
    if (draggedApplicant) {
      onMoveApplicant?.(draggedApplicant, stage, recruiter.id);
    }
    handleDragEnd();
  };

  return (
    <div className="w-full h-[calc(100%-200px)] min-h-[400px] bg-muted/30 rounded-lg p-4 flex gap-4">
      {recruiters.map((recruiter) => (
        <MultiRecruiterColumn
          key={recruiter.id}
          applicants={applicants}
          draggedApplicant={draggedApplicant}
          dragOverRecruiter={dragOverRecruiter}
          dragOverStage={dragOverStage}
          onCardClick={onCardClick}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          recruiter={recruiter}
          stages={stages}
        />
      ))}
    </div>
  );
}
