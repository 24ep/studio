"use client";

import type { Applicant, Position } from '@/lib/types';
import { ApplicantAssetsGrid } from './ApplicantEvaluationAssets';
import { ApplicantEvaluationHeader } from './ApplicantEvaluationModalHeader';
import { ApplicantEvaluationTabs } from './ApplicantEvaluationModalTabs';
import type {
  ApplicantEvaluationAttachment,
  ApplicantEvaluationData,
  ApplicantEvaluationLinkInfo,
  AveragedApplicantEvaluationData,
} from './applicant-evaluation-modal-api';
import type { ApplicantEvaluationPositionValidation } from './applicant-evaluation-modal-utils';
import type { ApplicantEvaluationSelectedFile } from './use-applicant-evaluation-modal-state';

export interface ApplicantEvaluationContentProps {
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

export type ApplicantEvaluationTabsProps = Omit<
  ApplicantEvaluationContentProps,
  'applicant' | 'position' | 'attachments' | 'onAttachmentSelect'
>;

export function ApplicantEvaluationContent({
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
}: ApplicantEvaluationContentProps) {
  return (
    <div className="h-full flex flex-col">
      <ApplicantEvaluationHeader applicant={applicant} position={position} />
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 overflow-hidden">
        <div className="h-full flex flex-col">
          <ApplicantAssetsGrid
            attachments={attachments}
            applicantId={applicant.id}
            onAttachmentSelect={onAttachmentSelect}
          />
          <ApplicantEvaluationTabs
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
          />
        </div>
      </div>
    </div>
  );
}
