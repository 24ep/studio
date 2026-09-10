"use client";

import type { Applicant, Position, RecruitmentStage } from '@/lib/types';
import type { ApplicantJobMatchModalData } from './full-applicant-detail-utils';
import {
  ApplicantActionModals,
  ApplicantEvaluationLinkModals,
  ApplicantTransitionModals,
  type EvaluationQrData,
  type HeadcountWarningData,
} from './FullApplicantDetailModalsParts';
import type { ReprocessAttachment } from './reprocess-modal-utils';

interface FullApplicantDetailModalsProps {
  applicant: Applicant;
  allDbPositions: Position[];
  appLogoUrl: string | null;
  availableStages: RecruitmentStage[];
  headcountWarningData: HeadcountWarningData | null;
  isCreateEvalLinkModalOpen: boolean;
  isDeleting: boolean;
  isDeleteModalOpen: boolean;
  isEditingEvalLink: boolean;
  isGenerativeAIModalOpen: boolean;
  isHeadcountWarningModalOpen: boolean;
  isJobMatchEnabled: boolean;
  isJobMatchModalOpen: boolean;
  isMobile: boolean;
  isPositionDrawerOpen: boolean;
  isQrModalOpen: boolean;
  isReprocessModalOpen: boolean;
  isSendInvitationModalOpen: boolean;
  isTransitionsModalOpen: boolean;
  preselectedStage: string | null;
  qrData: EvaluationQrData | null;
  resumes: ReprocessAttachment[];
  selectedJobMatch: ApplicantJobMatchModalData | null;
  selectedPositionId: string | null;
  onClearPreselectedStage: () => void;
  onCommentsChange: (options?: { refreshApplicantData?: boolean }) => void;
  onCopyEvaluationLink: () => void;
  onCreateEvalLinkModalOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => void;
  onDeleteModalOpenChange: (open: boolean) => void;
  onEditInterviewDetails: () => void;
  onEditingEvalLinkChange: (isEditing: boolean) => void;
  onEvaluationLinkCreated: (linkInfo: { url: string; expiresAt: string }) => void;
  onGenerativeAIModalOpenChange: (open: boolean) => void;
  onHeadcountWarningClose: () => void;
  onInvalidEvaluationUrl: () => void;
  onJobMatchModalClose: () => void;
  onPositionDrawerOpenChange: (open: boolean) => void;
  onQrModalOpenChange: (open: boolean) => void;
  onRefresh: () => void | Promise<void>;
  onReprocessModalOpenChange: (open: boolean) => void;
  onSelectedPositionIdChange: (positionId: string | null) => void;
  onSendInvitationModalOpenChange: (open: boolean) => void;
  onStatusUpdate: (status: string, notes?: string, suppressToast?: boolean) => Promise<boolean | undefined>;
  onTransitionsModalOpenChange: (open: boolean) => void;
}

export function FullApplicantDetailModals({
  applicant,
  allDbPositions,
  appLogoUrl,
  availableStages,
  headcountWarningData,
  isCreateEvalLinkModalOpen,
  isDeleting,
  isDeleteModalOpen,
  isEditingEvalLink,
  isGenerativeAIModalOpen,
  isHeadcountWarningModalOpen,
  isJobMatchEnabled,
  isJobMatchModalOpen,
  isMobile,
  isPositionDrawerOpen,
  isQrModalOpen,
  isReprocessModalOpen,
  isSendInvitationModalOpen,
  isTransitionsModalOpen,
  preselectedStage,
  qrData,
  resumes,
  selectedJobMatch,
  selectedPositionId,
  onClearPreselectedStage,
  onCommentsChange,
  onCopyEvaluationLink,
  onCreateEvalLinkModalOpenChange,
  onDeleteConfirm,
  onDeleteModalOpenChange,
  onEditInterviewDetails,
  onEditingEvalLinkChange,
  onEvaluationLinkCreated,
  onGenerativeAIModalOpenChange,
  onHeadcountWarningClose,
  onInvalidEvaluationUrl,
  onJobMatchModalClose,
  onPositionDrawerOpenChange,
  onQrModalOpenChange,
  onRefresh,
  onReprocessModalOpenChange,
  onSelectedPositionIdChange,
  onSendInvitationModalOpenChange,
  onStatusUpdate,
  onTransitionsModalOpenChange,
}: FullApplicantDetailModalsProps) {
  const handleTransitionsOpenChange = (open: boolean) => {
    onTransitionsModalOpenChange(open);
    if (!open) {
      onClearPreselectedStage();
    }
  };

  const handleCreateEvalLinkOpenChange = (open: boolean) => {
    onCreateEvalLinkModalOpenChange(open);
    if (!open) {
      onEditingEvalLinkChange(false);
    }
  };

  const handlePositionDrawerOpenChange = (open: boolean) => {
    onPositionDrawerOpenChange(open);
    if (!open) {
      onSelectedPositionIdChange(null);
    }
  };

  return (
    <>
      <ApplicantTransitionModals
        applicant={applicant}
        allDbPositions={allDbPositions}
        availableStages={availableStages}
        headcountWarningData={headcountWarningData}
        isGenerativeAIModalOpen={isGenerativeAIModalOpen}
        isHeadcountWarningModalOpen={isHeadcountWarningModalOpen}
        isJobMatchEnabled={isJobMatchEnabled}
        isJobMatchModalOpen={isJobMatchModalOpen}
        isReprocessModalOpen={isReprocessModalOpen}
        isTransitionsModalOpen={isTransitionsModalOpen}
        preselectedStage={preselectedStage}
        resumes={resumes}
        selectedJobMatch={selectedJobMatch}
        onCommentsChange={onCommentsChange}
        onGenerativeAIModalOpenChange={onGenerativeAIModalOpenChange}
        onHeadcountWarningClose={onHeadcountWarningClose}
        onJobMatchModalClose={onJobMatchModalClose}
        onRefresh={onRefresh}
        onReprocessModalOpenChange={onReprocessModalOpenChange}
        onStatusUpdate={onStatusUpdate}
        onTransitionsOpenChange={handleTransitionsOpenChange}
      />

      <ApplicantActionModals
        applicant={applicant}
        isDeleting={isDeleting}
        isDeleteModalOpen={isDeleteModalOpen}
        isPositionDrawerOpen={isPositionDrawerOpen}
        isSendInvitationModalOpen={isSendInvitationModalOpen}
        selectedPositionId={selectedPositionId}
        onDeleteConfirm={onDeleteConfirm}
        onDeleteModalOpenChange={onDeleteModalOpenChange}
        onPositionDrawerOpenChange={handlePositionDrawerOpenChange}
        onSendInvitationModalOpenChange={onSendInvitationModalOpenChange}
      />

      <ApplicantEvaluationLinkModals
        applicant={applicant}
        appLogoUrl={appLogoUrl}
        isCreateEvalLinkModalOpen={isCreateEvalLinkModalOpen}
        isEditingEvalLink={isEditingEvalLink}
        isMobile={isMobile}
        isQrModalOpen={isQrModalOpen}
        qrData={qrData}
        onCopyEvaluationLink={onCopyEvaluationLink}
        onCreateEvalLinkModalOpenChange={handleCreateEvalLinkOpenChange}
        onEditInterviewDetails={onEditInterviewDetails}
        onEvaluationLinkCreated={onEvaluationLinkCreated}
        onInvalidEvaluationUrl={onInvalidEvaluationUrl}
        onQrModalOpenChange={onQrModalOpenChange}
      />
    </>
  );
}
