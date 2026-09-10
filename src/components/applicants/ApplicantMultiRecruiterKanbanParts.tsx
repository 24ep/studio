"use client";

import type React from 'react';
import type { Applicant, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecruiterAvatarCompact } from '@/components/ui/recruiter-avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MultiRecruiterStageSection } from './ApplicantMultiRecruiterStageSection';

interface MultiRecruiterColumnProps {
  applicants: Applicant[];
  stages: string[];
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

export function MultiRecruiterColumn({
  applicants,
  stages,
  recruiter,
  draggedApplicant,
  dragOverStage,
  dragOverRecruiter,
  onCardClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: MultiRecruiterColumnProps) {
  return (
    <div className="flex-shrink-0 w-80 flex flex-col h-full">
      <Card className="flex flex-col h-full shadow-sm border border-border bg-card">
        <RecruiterColumnHeader recruiter={recruiter} />
        <ScrollArea className="flex-1 min-h-0">
          <CardContent className="p-4 space-y-4">
            {stages.map((stage) => (
              <MultiRecruiterStageSection
                key={stage}
                applicants={applicants}
                draggedApplicant={draggedApplicant}
                dragOverRecruiter={dragOverRecruiter}
                dragOverStage={dragOverStage}
                onCardClick={onCardClick}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragStart={onDragStart}
                onDrop={onDrop}
                recruiter={recruiter}
                stage={stage}
              />
            ))}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}

function RecruiterColumnHeader({ recruiter }: { recruiter: UserProfile }) {
  return (
    <CardHeader className="p-4 border-b border-border sticky top-16 bg-card z-10 flex-shrink-0">
      <div className="flex items-center gap-3">
        <RecruiterAvatarCompact
          user={{
            id: recruiter.id,
            name: recruiter.name,
            avatarUrl: recruiter.avatarUrl,
            personalColor: recruiter.personalColor,
          }}
          size="md"
        />
        <div>
          <CardTitle className="text-sm font-semibold text-foreground">{recruiter.name}</CardTitle>
          <p className="text-xs text-muted-foreground">Recruiter</p>
        </div>
      </div>
    </CardHeader>
  );
}
