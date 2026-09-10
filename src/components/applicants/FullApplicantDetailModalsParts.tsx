"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { DeleteApplicantModal } from './DeleteApplicantModal';
import { GenerativeAIModal } from './GenerativeAIModal';
import { HeadcountWarningModal } from './HeadcountWarningModal';
import JobMatchModal from './JobMatchModal';
import { ManageTransitionsModal } from './ManageTransitionsModal';
import ReprocessModal from './ReprocessModal';
import { SendInterviewInvitationModal } from './SendInterviewInvitationModal';
import { HeadcountModal } from '@/components/positions/HeadcountModal';
import { PositionDetailDrawer } from '@/components/positions/PositionDetailDrawer';
import type { HeadcountModalSaveData } from '@/components/positions/HeadcountModalTypes';
import { saveHeadcountForPosition } from '@/components/positions/hooks/headcount-tab-api';
import type { Applicant, Position, RecruitmentStage } from '@/lib/types';
import type { ApplicantJobMatchModalData } from './full-applicant-detail-utils';
import type { ReprocessAttachment } from './reprocess-modal-utils';

export { ApplicantEvaluationLinkModals } from './FullApplicantDetailEvaluationLinkModals';

export interface HeadcountWarningData {
  applicantName: string;
  positionTitle?: string;
  errorMessage: string;
}

export interface EvaluationQrData {
  name: string;
  url: string;
  avatarUrl: string | null;
  expiresAt?: string;
}

export function ApplicantTransitionModals({
  applicant,
  allDbPositions,
  availableStages,
  headcountWarningData,
  isGenerativeAIModalOpen,
  isHeadcountWarningModalOpen,
  isJobMatchEnabled,
  isJobMatchModalOpen,
  isReprocessModalOpen,
  isTransitionsModalOpen,
  preselectedStage,
  resumes,
  selectedJobMatch,
  onCommentsChange,
  onGenerativeAIModalOpenChange,
  onHeadcountWarningClose,
  onJobMatchModalClose,
  onRefresh,
  onReprocessModalOpenChange,
  onStatusUpdate,
  onTransitionsOpenChange,
}: {
  applicant: Applicant;
  allDbPositions: Position[];
  availableStages: RecruitmentStage[];
  headcountWarningData: HeadcountWarningData | null;
  isGenerativeAIModalOpen: boolean;
  isHeadcountWarningModalOpen: boolean;
  isJobMatchEnabled: boolean;
  isJobMatchModalOpen: boolean;
  isReprocessModalOpen: boolean;
  isTransitionsModalOpen: boolean;
  preselectedStage: string | null;
  resumes: ReprocessAttachment[];
  selectedJobMatch: ApplicantJobMatchModalData | null;
  onCommentsChange: (options?: { refreshApplicantData?: boolean }) => void;
  onGenerativeAIModalOpenChange: (open: boolean) => void;
  onHeadcountWarningClose: () => void;
  onJobMatchModalClose: () => void;
  onRefresh: () => void | Promise<void>;
  onReprocessModalOpenChange: (open: boolean) => void;
  onStatusUpdate: (status: string, notes?: string, suppressToast?: boolean) => Promise<boolean | undefined>;
  onTransitionsOpenChange: (open: boolean) => void;
}) {
  const [isCreateHeadcountModalOpen, setIsCreateHeadcountModalOpen] = useState(false);
  const positionId = applicant.positionId || '';

  const handleCreateHeadcountFromWarning = () => {
    onHeadcountWarningClose();

    if (!positionId) {
      toast.error('Assign a position before creating a headcount.');
      return;
    }

    setIsCreateHeadcountModalOpen(true);
  };

  const handleCreateHeadcountModalClose = () => {
    setIsCreateHeadcountModalOpen(false);
  };

  const handleCreateHeadcountSave = async (headcountData: HeadcountModalSaveData) => {
    if (!positionId) {
      toast.error('Assign a position before creating a headcount.');
      return;
    }

    await saveHeadcountForPosition({
      editingHeadcount: null,
      headcountData,
      positionId,
    });

    toast.success('Headcount created successfully');
    handleCreateHeadcountModalClose();
    await onRefresh();
  };

  return (
    <>
      <ManageTransitionsModal
        isOpen={isTransitionsModalOpen}
        onOpenChange={onTransitionsOpenChange}
        applicant={applicant}
        availableStages={availableStages}
        onUpdateApplicant={async (_id, status, notes, suppressToast) => onStatusUpdate(status, notes, suppressToast)}
        onRefreshApplicantData={async () => {
          await onRefresh();
        }}
        preselectedStage={preselectedStage}
        onCommentsChange={onCommentsChange}
      />

      {isJobMatchEnabled && (
        <JobMatchModal
          isOpen={isJobMatchModalOpen}
          onClose={onJobMatchModalClose}
          jobMatch={selectedJobMatch}
        />
      )}

      <ReprocessModal
        isOpen={isReprocessModalOpen}
        onOpenChange={onReprocessModalOpenChange}
        applicantId={applicant.id}
        applicantName={applicant.name || 'Unknown Applicant'}
        applicantPositionId={applicant.positionId}
        applicantSourceId={applicant.sourceId}
        attachments={resumes}
        positions={allDbPositions}
      />

      <GenerativeAIModal
        isOpen={isGenerativeAIModalOpen}
        onOpenChange={onGenerativeAIModalOpenChange}
        applicantId={applicant.id}
        applicantName={applicant.name || 'Unknown applicant'}
        onRefresh={onRefresh}
      />

      {headcountWarningData && (
        <HeadcountWarningModal
          isOpen={isHeadcountWarningModalOpen}
          onClose={onHeadcountWarningClose}
          applicantName={headcountWarningData.applicantName}
          positionTitle={headcountWarningData.positionTitle}
          errorMessage={headcountWarningData.errorMessage}
          onCreateHeadcount={positionId ? handleCreateHeadcountFromWarning : undefined}
        />
      )}

      <HeadcountModal
        open={isCreateHeadcountModalOpen}
        onOpenChange={setIsCreateHeadcountModalOpen}
        headcount={null}
        applicants={[applicant]}
        positionId={positionId}
        onSave={handleCreateHeadcountSave}
        onClose={handleCreateHeadcountModalClose}
      />
    </>
  );
}

export function ApplicantActionModals({
  applicant,
  isDeleting,
  isDeleteModalOpen,
  isPositionDrawerOpen,
  isSendInvitationModalOpen,
  selectedPositionId,
  onDeleteConfirm,
  onDeleteModalOpenChange,
  onPositionDrawerOpenChange,
  onSendInvitationModalOpenChange,
}: {
  applicant: Applicant;
  isDeleting: boolean;
  isDeleteModalOpen: boolean;
  isPositionDrawerOpen: boolean;
  isSendInvitationModalOpen: boolean;
  selectedPositionId: string | null;
  onDeleteConfirm: () => void;
  onDeleteModalOpenChange: (open: boolean) => void;
  onPositionDrawerOpenChange: (open: boolean) => void;
  onSendInvitationModalOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <DeleteApplicantModal
        isOpen={isDeleteModalOpen}
        onOpenChange={onDeleteModalOpenChange}
        applicant={applicant}
        onConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
      />

      <SendInterviewInvitationModal
        isOpen={isSendInvitationModalOpen}
        onOpenChange={onSendInvitationModalOpenChange}
        applicant={applicant}
      />

      <PositionDetailDrawer
        isOpen={isPositionDrawerOpen}
        onOpenChange={onPositionDrawerOpenChange}
        positionId={selectedPositionId}
      />
    </>
  );
}
