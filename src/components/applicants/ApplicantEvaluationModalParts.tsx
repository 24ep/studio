"use client";

import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  ArrowPathIcon as Loader2,
} from '@heroicons/react/24/outline';
import type { Applicant, Position } from '@/lib/types';
import { ApplicantEvaluationContent } from './ApplicantEvaluationModalContent';
import type {
  ApplicantEvaluationAttachment,
  ApplicantEvaluationData,
  ApplicantEvaluationLinkInfo,
  AveragedApplicantEvaluationData,
} from './applicant-evaluation-modal-api';
import type { ApplicantEvaluationPositionValidation } from './applicant-evaluation-modal-utils';
import type { ApplicantEvaluationSelectedFile } from './use-applicant-evaluation-modal-state';

interface ApplicantEvaluationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  position?: Position;
  attachments: ApplicantEvaluationAttachment[];
  averagedEvaluationData: AveragedApplicantEvaluationData | null;
  evaluationData: ApplicantEvaluationData | null;
  linkInfo: ApplicantEvaluationLinkInfo | null;
  linkLoading: boolean;
  expireDays: number;
  requireLogin: boolean;
  canViewLinks: boolean;
  canCreateLink: boolean;
  canManageLink: boolean;
  positionValidation: ApplicantEvaluationPositionValidation;
  onExpireDaysChange: (days: number) => void;
  onRequireLoginChange: (required: boolean) => void;
  onCreateLink: () => void;
  onStartEvaluation: () => void;
  onCopyLink: () => void;
  onRemoveLink: () => void;
  onRecreateLink: () => void;
  onConfigurePosition: () => void;
  onAttachmentSelect: (attachment: ApplicantEvaluationSelectedFile) => void;
}

export function ApplicantEvaluationLoadingDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] lg:w-[50vw] h-[95vh] p-0 overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading evaluation data...</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ApplicantEvaluationDialog({
  isOpen,
  onOpenChange,
  applicant,
  position,
  attachments,
  averagedEvaluationData,
  evaluationData,
  linkInfo,
  linkLoading,
  expireDays,
  requireLogin,
  canViewLinks,
  canCreateLink,
  canManageLink,
  positionValidation,
  onExpireDaysChange,
  onRequireLoginChange,
  onCreateLink,
  onStartEvaluation,
  onCopyLink,
  onRemoveLink,
  onRecreateLink,
  onConfigurePosition,
  onAttachmentSelect,
}: ApplicantEvaluationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] lg:w-[50vw] h-[95vh] p-0 overflow-hidden">
        <ApplicantEvaluationContent
          applicant={applicant}
          position={position}
          attachments={attachments}
          averagedEvaluationData={averagedEvaluationData}
          evaluationData={evaluationData}
          linkInfo={linkInfo}
          linkLoading={linkLoading}
          expireDays={expireDays}
          requireLogin={requireLogin}
          canViewLinks={canViewLinks}
          canCreateLink={canCreateLink}
          canManageLink={canManageLink}
          positionValidation={positionValidation}
          onExpireDaysChange={onExpireDaysChange}
          onRequireLoginChange={onRequireLoginChange}
          onCreateLink={onCreateLink}
          onStartEvaluation={onStartEvaluation}
          onCopyLink={onCopyLink}
          onRemoveLink={onRemoveLink}
          onRecreateLink={onRecreateLink}
          onConfigurePosition={onConfigurePosition}
          onAttachmentSelect={onAttachmentSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
