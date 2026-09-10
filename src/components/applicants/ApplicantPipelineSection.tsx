import React from 'react';
import { RecruitmentPipelineCard } from './RecruitmentPipelineCard';
import { ApplicantRecruiterCell } from './ApplicantRecruiterCell';
import type { Applicant, UserProfile, RecruitmentStage, TransitionRecord } from '@/lib/types';

interface ApplicantPipelineSectionProps {
  applicant: Applicant;
  availableStages: RecruitmentStage[];
  transitionHistory: TransitionRecord[];
  onStageClick: (stageName?: string) => void;
  onNoteEdit: (transitionId: string, newNote: string) => Promise<void>;
  applicantId: string;
}

export const ApplicantPipelineSection: React.FC<ApplicantPipelineSectionProps> = ({
  applicant,
  availableStages,
  transitionHistory,
  onStageClick,
  onNoteEdit,
  applicantId
}) => {
  return (
    <div className="bg-background border-t border-border p-1">
      {/* Recruitment Pipeline - Full width of parent container */}
      {availableStages.length > 0 && applicant && (
        <div className="p-2">
          <RecruitmentPipelineCard
            stages={availableStages}
            transitionHistory={transitionHistory}
            currentStatus={applicant.statusId || applicant.status || ''}
            onStageClick={onStageClick}
            editableNotes={true}
            onNoteEdit={onNoteEdit}
            applicantId={applicantId}
          />
        </div>
      )}
    </div>
  );
};
