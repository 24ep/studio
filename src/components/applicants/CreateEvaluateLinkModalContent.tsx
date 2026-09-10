"use client";

import { ArrowPathIcon as Loader2 } from "@heroicons/react/24/outline";

import { CreateEvaluateLinkConfigureStep } from "./CreateEvaluateLinkConfigureStep";
import { CreateEvaluateLinkEmailStep } from "./CreateEvaluateLinkEmailStep";
import { CreateEvaluateLinkFooter } from "./CreateEvaluateLinkFooter";
import { CreateEvaluateLinkStepIndicator } from "./CreateEvaluateLinkStepIndicator";
import { CreateEvaluateLinkSuccessStep } from "./CreateEvaluateLinkSuccessStep";
import type { CreateEvaluateLinkApplicantInfo } from "./create-evaluate-link-utils";
import type { CreateEvaluateLinkModalController } from "./use-create-evaluate-link-modal";

export interface CreateEvaluateLinkModalContentProps {
  applicant: CreateEvaluateLinkApplicantInfo;
  modal: CreateEvaluateLinkModalController;
  onClose: () => void;
}

export function CreateEvaluateLinkModalContent({
  applicant,
  modal,
  onClose,
}: CreateEvaluateLinkModalContentProps) {
  return (
    <>
      {modal.currentStep !== "success" && (
        <CreateEvaluateLinkStepIndicator
          currentStep={modal.currentStep}
          invitationEnabled={modal.isInterviewInvitationEnabled}
          sendEmail={modal.sendEmail}
        />
      )}
      <CreateEvaluateLinkModalStepBody applicant={applicant} modal={modal} />
      <div className="pt-4 border-t">
        <CreateEvaluateLinkFooter
          currentStep={modal.currentStep}
          loading={modal.loading}
          positionValidationLoading={modal.positionValidation.isLoading}
          canProceed={modal.canProceed}
          invitationEnabled={modal.isInterviewInvitationEnabled}
          sendEmail={modal.sendEmail}
          selectedInterviewerCount={modal.selectedInterviewerIds.size}
          onClose={onClose}
          onBack={modal.handleBack}
          onNext={modal.handleNext}
        />
      </div>
    </>
  );
}

function CreateEvaluateLinkModalStepBody({
  applicant,
  modal,
}: Pick<CreateEvaluateLinkModalContentProps, "applicant" | "modal">) {
  if (modal.positionValidation.isLoading || modal.featureLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (modal.currentStep === "configure") {
    return (
      <CreateEvaluateLinkConfigureStep
        positionValidation={modal.positionValidation}
        canProceed={modal.canProceed}
        expireDays={modal.expireDays}
        onExpireDaysChange={modal.setExpireDays}
        requireLogin={modal.requireLogin}
        onRequireLoginChange={modal.setRequireLogin}
        interviewDate={modal.interviewDate}
        onInterviewDateChange={modal.setInterviewDate}
        datePickerOpen={modal.datePickerOpen}
        onDatePickerOpenChange={modal.setDatePickerOpen}
        interviewTime={modal.interviewTime}
        onInterviewTimeChange={modal.setInterviewTime}
        duration={modal.duration}
        onDurationChange={modal.setDuration}
        location={modal.location}
        onLocationChange={modal.setLocation}
        onLocationEmailChange={modal.setLocationEmail}
        isCustomLocation={modal.isCustomLocation}
        onCustomLocationChange={modal.setIsCustomLocation}
        azureRooms={modal.azureRooms}
        azureMeetingRoomsEnabled={modal.azureMeetingRoomsEnabled}
        interviewers={modal.interviewers}
        availableUsers={modal.availableUsers}
        selectedInterviewerIds={modal.selectedInterviewerIds}
        onToggleInterviewer={modal.toggleInterviewer}
        addInterviewerOpen={modal.addInterviewerOpen}
        onAddInterviewerOpenChange={modal.setAddInterviewerOpen}
        selectedUserIds={modal.selectedUserIds}
        onSelectedUserIdsChange={modal.setSelectedUserIds}
        addingInterviewers={modal.addingInterviewers}
        interviewerSearchQuery={modal.interviewerSearchQuery}
        onInterviewerSearchQueryChange={modal.setInterviewerSearchQuery}
        onAddInterviewers={modal.handleAddInterviewers}
        invitationEnabled={modal.isInterviewInvitationEnabled}
        sendEmail={modal.sendEmail}
        onSendEmailChange={modal.setSendEmail}
      />
    );
  }

  if (modal.currentStep === "email") {
    return (
      <CreateEvaluateLinkEmailStep
        loadingTemplate={modal.loadingTemplate}
        emailSubject={modal.emailSubject}
        emailBody={modal.emailBody}
        systemEditorMode={modal.systemEditorMode}
        onEmailSubjectChange={modal.setEmailSubject}
        onEmailBodyChange={modal.setEmailBody}
      />
    );
  }

  return (
    <CreateEvaluateLinkSuccessStep
      applicantName={applicant.name}
      linkInfo={modal.linkInfo}
      appLogoUrl={modal.appLogoUrl}
      copied={modal.copied}
      onCopyLink={modal.copyLink}
      onDownloadQr={modal.downloadQR}
    />
  );
}
