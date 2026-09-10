"use client";

import { ExclamationCircleIcon as AlertCircle } from '@heroicons/react/24/outline';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Applicant } from '@/lib/types';
import { SendInterviewInvitationEmailStep } from './SendInterviewInvitationEmailStep';
import { SendInterviewInvitationFooter } from './SendInterviewInvitationFooter';
import { SendInterviewInvitationPreviewStep } from './SendInterviewInvitationPreviewStep';
import { SendInterviewInvitationScheduleStep } from './SendInterviewInvitationScheduleStep';
import { SendInterviewInvitationStepIndicator, type SendInterviewInvitationStep } from './SendInterviewInvitationStepIndicator';
import { useSendInterviewInvitationModal } from './use-send-interview-invitation-modal';

interface SendInterviewInvitationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
}

const getStepDescription = (step: SendInterviewInvitationStep, applicantName: string) => {
  if (step === 'select-interviewers') {
    return `Select interviewers and schedule details for ${applicantName}`;
  }

  if (step === 'edit-email') {
    return `Review and edit email content for ${applicantName}`;
  }

  return 'Preview email before sending to interviewers';
};

export function SendInterviewInvitationModal({
  isOpen,
  onOpenChange,
  applicant,
}: SendInterviewInvitationModalProps) {
  const modal = useSendInterviewInvitationModal({
    applicant,
    isOpen,
    onOpenChange,
  });
  const dialogId = `send-interview-invitation-modal-${applicant.id}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        dialogId={dialogId}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Send Interview Invitation</DialogTitle>
          <DialogDescription>
            {getStepDescription(modal.currentStep, applicant.name)}
          </DialogDescription>
        </DialogHeader>

        {modal.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{modal.error}</AlertDescription>
          </Alert>
        )}

        <SendInterviewInvitationStepIndicator currentStep={modal.currentStep} />

        {modal.currentStep === 'select-interviewers' && (
          <SendInterviewInvitationScheduleStep
            interviewDate={modal.interviewDate}
            interviewTime={modal.interviewTime}
            duration={modal.duration}
            location={modal.location}
            locationEmail={modal.locationEmail}
            locationType={modal.locationType}
            rooms={modal.rooms}
            loadingRooms={modal.loadingRooms}
            interviewers={modal.interviewers}
            selectedInterviewerIds={modal.selectedInterviewerIds}
            loadingInterviewers={modal.loadingInterviewers}
            addInterviewerOpen={modal.addInterviewerOpen}
            filteredAvailableUsers={modal.filteredAvailableUsers}
            selectedUserIds={modal.selectedUserIds}
            loadingUsers={modal.loadingUsers}
            addingInterviewers={modal.addingInterviewers}
            onInterviewDateChange={modal.setInterviewDate}
            onInterviewTimeChange={modal.setInterviewTime}
            onDurationChange={modal.setDuration}
            onLocationChange={modal.setLocation}
            onLocationEmailChange={modal.setLocationEmail}
            onLocationTypeChange={modal.setLocationType}
            onAddInterviewerOpenChange={modal.setAddInterviewerOpen}
            onSelectedUserIdsChange={modal.setSelectedUserIds}
            onAddInterviewers={modal.handleAddInterviewers}
            onToggleInterviewer={modal.toggleInterviewer}
          />
        )}

        {modal.currentStep === 'edit-email' && (
          <SendInterviewInvitationEmailStep
            loadingTemplate={modal.loadingTemplate}
            emailSubject={modal.emailSubject}
            emailBody={modal.emailBody}
            emailEditorMode={modal.emailEditorMode}
            onEmailSubjectChange={modal.setEmailSubject}
            onEmailBodyChange={modal.setEmailBody}
            onEmailEditorModeChange={modal.setEmailEditorMode}
          />
        )}

        {modal.currentStep === 'preview-email' && (
          <SendInterviewInvitationPreviewStep
            emailSubject={modal.emailSubject}
            emailBody={modal.emailBody}
            selectedInterviewerCount={modal.selectedInterviewerIds.size}
          />
        )}

        <SendInterviewInvitationFooter
          currentStep={modal.currentStep}
          loading={modal.loading}
          loadingInterviewers={modal.loadingInterviewers}
          hasInterviewDate={Boolean(modal.interviewDate)}
          hasPosition={Boolean(applicant.positionId)}
          selectedInterviewerCount={modal.selectedInterviewerIds.size}
          emailSubject={modal.emailSubject}
          emailBody={modal.emailBody}
          onBack={modal.handleBack}
          onClose={() => onOpenChange(false)}
          onNext={modal.handleNext}
          onSubmit={modal.handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
