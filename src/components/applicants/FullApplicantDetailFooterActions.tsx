"use client";

import { useState } from 'react';

import {
  NextStagePopover,
  RejectStagePopover,
} from '@/components/applicants/FullApplicantDetailFooterActionPopovers';
import { resolveFooterStages } from '@/components/applicants/full-applicant-detail-footer-utils';
import type { Applicant, RecruitmentStage } from '@/lib/types';

interface FullApplicantDetailFooterActionsProps {
  applicant: Pick<Applicant, 'status' | 'statusId'>;
  availableStages: RecruitmentStage[];
  isStatusUpdating: boolean;
  onStatusUpdate: (status: string, notes?: string) => Promise<boolean | undefined>;
  reviewMode?: boolean;
}

export function FullApplicantDetailFooterActions({
  applicant,
  availableStages,
  isStatusUpdating,
  onStatusUpdate,
  reviewMode = false,
}: FullApplicantDetailFooterActionsProps) {
  const [statusNote, setStatusNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [isNextStagePopoverOpen, setIsNextStagePopoverOpen] = useState(false);
  const [isRejectPopoverOpen, setIsRejectPopoverOpen] = useState(false);
  const { rejectedStage, nextStage, isRejected } = resolveFooterStages(applicant, availableStages);

  const resetRejectPopover = () => {
    setIsRejectPopoverOpen(false);
    setRejectNote('');
  };

  const resetNextStagePopover = () => {
    setIsNextStagePopoverOpen(false);
    setStatusNote('');
  };

  const confirmRejectedStage = async () => {
    if (!rejectedStage) return;

    const result = await onStatusUpdate(rejectedStage.id, rejectNote);
    if (result) {
      resetRejectPopover();
    }
  };

  const confirmNextStage = async () => {
    if (!nextStage) return;

    const result = await onStatusUpdate(nextStage.id, statusNote);
    if (result) {
      resetNextStagePopover();
    }
  };

  if (!rejectedStage && !nextStage) {
    return null;
  }

  return (
    <div className="border-t bg-background p-4 flex justify-end items-center gap-3 flex-shrink-0 z-[50]">
      {rejectedStage && !isRejected && (
        <RejectStagePopover
          isOpen={isRejectPopoverOpen}
          isStatusUpdating={isStatusUpdating}
          note={rejectNote}
          onConfirm={confirmRejectedStage}
          onNoteChange={setRejectNote}
          onOpenChange={setIsRejectPopoverOpen}
          onReset={resetRejectPopover}
          reviewMode={reviewMode}
        />
      )}

      {nextStage && (
        <NextStagePopover
          isOpen={isNextStagePopoverOpen}
          isStatusUpdating={isStatusUpdating}
          nextStage={nextStage}
          note={statusNote}
          onConfirm={confirmNextStage}
          onNoteChange={setStatusNote}
          onOpenChange={setIsNextStagePopoverOpen}
          onReset={resetNextStagePopover}
          reviewMode={reviewMode}
        />
      )}
    </div>
  );
}
