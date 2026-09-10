"use client";

import { ApplicantEvaluationQrCodeModal } from './ApplicantEvaluationQrCodeModal';
import { CreateEvaluateLinkModal } from '@/components/applicants/CreateEvaluateLinkModal';
import type { Applicant } from '@/lib/types';
import { getEvaluateLinkInitialData } from './full-applicant-detail-modals-utils';
import type { EvaluationQrData } from './FullApplicantDetailModalsParts';

export function ApplicantEvaluationLinkModals({
  applicant,
  appLogoUrl,
  isCreateEvalLinkModalOpen,
  isEditingEvalLink,
  isMobile,
  isQrModalOpen,
  qrData,
  onCopyEvaluationLink,
  onCreateEvalLinkModalOpenChange,
  onEditInterviewDetails,
  onEvaluationLinkCreated,
  onInvalidEvaluationUrl,
  onQrModalOpenChange,
}: {
  applicant: Applicant;
  appLogoUrl: string | null;
  isCreateEvalLinkModalOpen: boolean;
  isEditingEvalLink: boolean;
  isMobile: boolean;
  isQrModalOpen: boolean;
  qrData: EvaluationQrData | null;
  onCopyEvaluationLink: () => void;
  onCreateEvalLinkModalOpenChange: (open: boolean) => void;
  onEditInterviewDetails: () => void;
  onEvaluationLinkCreated: (linkInfo: { url: string; expiresAt: string }) => void;
  onInvalidEvaluationUrl: () => void;
  onQrModalOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <CreateEvaluateLinkModal
        isOpen={isCreateEvalLinkModalOpen}
        onOpenChange={onCreateEvalLinkModalOpenChange}
        applicant={{
          id: applicant.id,
          name: applicant.name,
          email: applicant.email,
          avatarUrl: applicant.avatarUrl || null,
          positionId: applicant.positionId,
          position: applicant.position ? { id: applicant.position.id, title: applicant.position.title } : null,
        }}
        editMode={isEditingEvalLink}
        initialData={isEditingEvalLink ? getEvaluateLinkInitialData(applicant.customAttributes) : undefined}
        onSuccess={onEvaluationLinkCreated}
      />

      <ApplicantEvaluationQrCodeModal
        open={isQrModalOpen}
        onOpenChange={onQrModalOpenChange}
        isMobile={isMobile}
        qrData={qrData}
        appLogoUrl={appLogoUrl}
        onEditInterviewDetails={onEditInterviewDetails}
        onCopyLink={onCopyEvaluationLink}
        onInvalidUrl={onInvalidEvaluationUrl}
      />
    </>
  );
}
