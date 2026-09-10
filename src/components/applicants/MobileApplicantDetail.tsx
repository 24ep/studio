"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { PositionDetailDrawer } from '@/components/positions/PositionDetailDrawer';
import { FileViewerModal } from '@/components/ui/file-viewer-modal';
import { DeleteApplicantModal } from './DeleteApplicantModal';
import { MobileApplicantDetailSkeleton } from './ApplicantDetailSkeleton';
import { MobileApplicantFooterActions } from './MobileApplicantFooterActions';
import { MobileApplicantActionDialogs } from './MobileApplicantActionDialogs';
import { MobileApplicantTabsNav } from './MobileApplicantTabsNav';
import {
  MobileApplicantFloatingActionsButton,
  MobileApplicantHeader,
  MobileApplicantTabsContent,
} from './MobileApplicantDetailParts';
import { useMobileApplicantDetail } from './use-mobile-applicant-detail';

interface MobileApplicantDetailProps {
  applicantId: string;
  onClose?: () => void;
  onRefresh?: () => void;
}

export default function MobileApplicantDetail({
  applicantId,
  onClose,
  onRefresh
}: MobileApplicantDetailProps) {
  const detail = useMobileApplicantDetail({ applicantId, onClose, onRefresh });

  if (detail.isLoading) {
    return <MobileApplicantDetailSkeleton />;
  }

  if (detail.error || !detail.applicant) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-destructive mb-4">{detail.error || 'Applicant not found'}</p>
        <Button onClick={detail.loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div ref={detail.mainContainerRef} className="h-full w-full flex flex-col bg-background overflow-hidden">
      <MobileApplicantHeader
        applicant={detail.applicant}
        nameInfo={detail.nameInfo}
        isScrolled={detail.isScrolled}
        onClose={onClose}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <MobileApplicantTabsNav
          activeTab={detail.activeTab}
          attachmentsCount={detail.attachments.length}
          commentsCount={detail.comments.length}
          onTabChange={detail.setActiveTab}
        />

        <div className="flex-1 overflow-hidden min-h-0">
          <MobileApplicantTabsContent
            activeTab={detail.activeTab}
            applicant={detail.applicant}
            applicantId={applicantId}
            allDbPositions={detail.allDbPositions}
            availableStages={detail.availableStages}
            availableRecruiters={detail.availableRecruiters}
            availableSources={detail.availableSources}
            attachments={detail.attachments}
            comments={detail.comments}
            education={detail.education}
            experience={detail.experience}
            appliedJobId={detail.appliedJobId}
            appliedFitScore={detail.appliedFitScore}
            appliedJustification={detail.appliedJustification}
            onOpenPositionDrawer={detail.handleOpenPositionDrawer}
            onRefresh={detail.handleRefresh}
            onFileSelect={(file) => {
              detail.setSelectedFile(file);
              detail.setIsFileViewerOpen(true);
            }}
          />
        </div>
      </div>

      <MobileApplicantFloatingActionsButton onOpen={() => detail.setIsActionsModalOpen(true)} />

      <MobileApplicantActionDialogs
        applicant={detail.applicant}
        nameInfo={detail.nameInfo}
        isActionsModalOpen={detail.isActionsModalOpen}
        onActionsModalOpenChange={detail.setIsActionsModalOpen}
        isStatusModalOpen={detail.isStatusModalOpen}
        onStatusModalOpenChange={detail.setIsStatusModalOpen}
        isRecruiterModalOpen={detail.isRecruiterModalOpen}
        onRecruiterModalOpenChange={detail.setIsRecruiterModalOpen}
        availableStages={detail.availableStages}
        newStatus={detail.newStatus}
        onNewStatusChange={detail.setNewStatus}
        transitionNotes={detail.transitionNotes}
        onTransitionNotesChange={detail.setTransitionNotes}
        onChangeStatus={detail.handleChangeStatus}
        availableRecruiters={detail.availableRecruiters}
        newRecruiterId={detail.newRecruiterId}
        onNewRecruiterIdChange={detail.setNewRecruiterId}
        onAssignRecruiter={detail.handleAssignRecruiter}
        isCreatingEmployee={detail.isCreatingEmployee}
        onCreateEmployee={detail.handleCreateEmployee}
        onTogglePin={detail.handleTogglePin}
        onRefresh={detail.handleRefresh}
        onRequestDelete={() => detail.setIsDeleteModalOpen(true)}
      />

      {
        detail.selectedPositionId && (
          <PositionDetailDrawer
            isOpen={detail.isPositionDrawerOpen}
            onOpenChange={detail.setIsPositionDrawerOpen}
            positionId={detail.selectedPositionId}
          />
        )
      }

      <DeleteApplicantModal
        isOpen={detail.isDeleteModalOpen}
        onOpenChange={detail.setIsDeleteModalOpen}
        applicant={detail.applicant}
        onConfirm={detail.handleDelete}
        isDeleting={detail.isDeleting}
      />

      <FileViewerModal
        isOpen={detail.isFileViewerOpen}
        onOpenChange={detail.setIsFileViewerOpen}
        file={detail.selectedFile}
      />

      <MobileApplicantFooterActions
        applicant={detail.applicant}
        availableStages={detail.availableStages}
        isStatusUpdating={detail.isStatusUpdating}
        rejectNote={detail.footerRejectNote}
        onRejectNoteChange={detail.setFooterRejectNote}
        statusNote={detail.footerStatusNote}
        onStatusNoteChange={detail.setFooterStatusNote}
        isRejectPopoverOpen={detail.isRejectPopoverOpen}
        onRejectPopoverOpenChange={detail.setIsRejectPopoverOpen}
        isNextStagePopoverOpen={detail.isFooterPopoverOpen}
        onNextStagePopoverOpenChange={detail.setIsFooterPopoverOpen}
        onStatusUpdate={detail.handleStatusUpdate}
      />
    </div >
  );
}
