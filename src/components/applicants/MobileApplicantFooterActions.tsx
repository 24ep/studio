"use client";

import type { Applicant } from '@/lib/types';
import {
  NextStagePopover,
  RejectApplicantPopover,
  type MobileApplicantStage,
} from './MobileApplicantFooterActionPopovers';

interface MobileApplicantFooterActionsProps {
  applicant: Applicant | null;
  availableStages: MobileApplicantStage[];
  isStatusUpdating: boolean;
  rejectNote: string;
  onRejectNoteChange: (note: string) => void;
  statusNote: string;
  onStatusNoteChange: (note: string) => void;
  isRejectPopoverOpen: boolean;
  onRejectPopoverOpenChange: (open: boolean) => void;
  isNextStagePopoverOpen: boolean;
  onNextStagePopoverOpenChange: (open: boolean) => void;
  onStatusUpdate: (statusId: string, notes?: string) => Promise<boolean>;
}

export function MobileApplicantFooterActions({
  applicant,
  availableStages,
  isStatusUpdating,
  rejectNote,
  onRejectNoteChange,
  statusNote,
  onStatusNoteChange,
  isRejectPopoverOpen,
  onRejectPopoverOpenChange,
  isNextStagePopoverOpen,
  onNextStagePopoverOpenChange,
  onStatusUpdate,
}: MobileApplicantFooterActionsProps) {
  if (!applicant || availableStages.length === 0) {
    return null;
  }

  const rejectedStage = availableStages.find((stage) => stage.name.toLowerCase() === 'rejected');
  const currentStatusId = applicant.statusId;
  const currentStatusName = (applicant.status || '').toLowerCase();
  const currentStageIndex = availableStages.findIndex(
    (stage) => stage.id === currentStatusId || stage.name.toLowerCase() === currentStatusName,
  );
  const nextStage = currentStageIndex !== -1 && currentStageIndex < availableStages.length - 1
    ? availableStages[currentStageIndex + 1]
    : null;
  const canReject = rejectedStage && currentStatusId !== rejectedStage.id && currentStatusName !== 'rejected';

  return (
    <div className="border-t bg-background p-4 flex justify-end items-center gap-3 flex-shrink-0 z-[40] relative">
      {canReject && (
        <RejectApplicantPopover
          isOpen={isRejectPopoverOpen}
          isStatusUpdating={isStatusUpdating}
          onNoteChange={onRejectNoteChange}
          onOpenChange={onRejectPopoverOpenChange}
          onStatusUpdate={onStatusUpdate}
          rejectNote={rejectNote}
          rejectedStage={rejectedStage}
        />
      )}

      {nextStage && (
        <NextStagePopover
          isOpen={isNextStagePopoverOpen}
          isStatusUpdating={isStatusUpdating}
          nextStage={nextStage}
          onNoteChange={onStatusNoteChange}
          onOpenChange={onNextStagePopoverOpenChange}
          onStatusUpdate={onStatusUpdate}
          statusNote={statusNote}
        />
      )}
    </div>
  );
}
