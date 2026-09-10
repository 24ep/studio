"use client";

import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Applicant, Position } from '@/lib/types';
import { FileViewerModal } from '@/components/ui/file-viewer-modal';
import { canViewEvaluationLinks, canCreateEvaluationLink, canManageEvaluationLink } from '@/lib/permissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { CreateEvaluateLinkModal } from './CreateEvaluateLinkModal';
import { sanitizeUrl } from '@/lib/utils';
import { useApplicantEvaluationModalState } from './use-applicant-evaluation-modal-state';
import {
  ApplicantEvaluationDialog,
  ApplicantEvaluationLoadingDialog,
} from './ApplicantEvaluationModalParts';
import { LinkCreatedModal } from './ApplicantEvaluationLinkCreatedModal';

interface ApplicantEvaluationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  position?: Position;
}

export function ApplicantEvaluationModal({
  isOpen,
  onOpenChange,
  applicant,
  position,
}: ApplicantEvaluationModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();

  const canViewLinks = canViewEvaluationLinks(session?.user).canView;
  const canCreateLink = canCreateEvaluationLink(session?.user, applicant.recruiterId, session?.user?.id || '').canCreate;
  const {
    attachments,
    averagedEvaluationData,
    createOrGetLink,
    evaluationData,
    expireDays,
    fetchEvaluationLink,
    fileViewerOpen,
    handleStartEvaluation,
    linkInfo,
    linkLoading,
    loading,
    positionValidation,
    removeLink,
    requireLogin,
    selectedFile,
    setExpireDays,
    setFileViewerOpen,
    setRequireLogin,
    setSelectedFile,
    setShowCreateLinkModal,
    setShowLinkModal,
    showCreateLinkModal,
    showLinkModal,
  } = useApplicantEvaluationModalState({
    isOpen,
    applicant,
    position,
    canViewLinks,
  });
  const canManageLink = linkInfo ? canManageEvaluationLink(session?.user, linkInfo.createdBy?.id, session?.user?.id || '').canManage : false;

  const copyEvaluationLink = () => {
    if (linkInfo?.url) {
      navigator.clipboard.writeText(linkInfo.url).then(() => toast.success('Link copied'));
    }
  };

  const openEvaluationLink = () => {
    if (!linkInfo?.url) return;

    const safeUrl = sanitizeUrl(linkInfo.url);
    if (safeUrl) {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Invalid link');
    }
  };

  if (loading) {
    return (
      <ApplicantEvaluationLoadingDialog
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />
    );
  }

  return (
    <>
      <ApplicantEvaluationDialog
        isOpen={isOpen}
        onOpenChange={onOpenChange}
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
        onExpireDaysChange={setExpireDays}
        onRequireLoginChange={setRequireLogin}
        onCreateLink={() => setShowCreateLinkModal(true)}
        onStartEvaluation={handleStartEvaluation}
        onCopyLink={copyEvaluationLink}
        onRemoveLink={removeLink}
        onRecreateLink={() => createOrGetLink(true)}
        onConfigurePosition={() => {
          onOpenChange(false);
          router.push(`/applicants/${applicant.id}`);
        }}
        onAttachmentSelect={(file) => {
          setSelectedFile(file);
          setFileViewerOpen(true);
        }}
      />

      <LinkCreatedModal
        isMobile={isMobile}
        open={showLinkModal}
        onOpenChange={setShowLinkModal}
        requireLogin={requireLogin}
        linkInfo={linkInfo}
        onCopyLink={copyEvaluationLink}
        onOpenLink={openEvaluationLink}
      />

      <CreateEvaluateLinkModal
        isOpen={showCreateLinkModal}
        onOpenChange={(open) => {
          setShowCreateLinkModal(open);
          if (!open) {
            fetchEvaluationLink();
          }
        }}
        applicant={{
          id: applicant.id,
          name: applicant.name,
          email: applicant.email || null,
          avatarUrl: applicant.avatarUrl || null,
          positionId: applicant.positionId || position?.id || null,
          position: position ? { id: position.id, title: position.title } : null,
        }}
        onSuccess={() => {
          setShowCreateLinkModal(false);
          fetchEvaluationLink();
        }}
      />

      <FileViewerModal
        isOpen={fileViewerOpen}
        onOpenChange={setFileViewerOpen}
        file={selectedFile}
      />
    </>
  );
}
