import { ChevronLeftIcon as ChevronLeft } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";

import { ApplicantHeader } from "./ApplicantHeader";
import type { FullApplicantDetailSectionProps } from "./FullApplicantDetailViewTypes";

export function FullApplicantMobileBackBar({
  controller,
}: FullApplicantDetailSectionProps) {
  if (!controller.isMobile || controller.isModal) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background sticky top-0 z-[100]">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Back to applicants"
        onClick={controller.onClose}
        className="hover:bg-muted"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <span className="font-semibold text-lg">Back</span>
    </div>
  );
}

export function FullApplicantHeaderSection({
  controller,
}: FullApplicantDetailSectionProps) {
  return (
    <div className="relative">
      <ApplicantHeader
        applicant={controller.applicant}
        isModal={controller.isModal}
        onClose={controller.onClose}
        isEditing={controller.isEditing}
        availableStages={controller.availableStages}
        onEditClick={controller.handleEnterEditMode}
        onCreateEmployee={controller.handleCreateEmployee}
        isCreatingEmployee={controller.isCreatingEmployee}
        onManageTransitions={controller.openManageTransitionsModal}
        onReprocess={() => controller.setIsReprocessModalOpen(true)}
        onGenerativeAI={() => controller.setIsGenerativeAIModalOpen(true)}
        onEvaluate={controller.handleEvaluate}
        onSendInterviewInvitation={!controller.isInterviewInvitationEnabled
          ? () => controller.setIsSendInvitationModalOpen(true)
          : undefined}
        onDelete={() => controller.setIsDeleteModalOpen(true)}
        onTogglePin={controller.handleTogglePin}
        onToggleBlacklist={controller.handleToggleBlacklist}
        onToggleRead={controller.handleToggleRead}
        avatarInputRef={controller.avatarInputRef}
        avatarUploading={controller.avatarUploading}
        avatarError={controller.avatarError}
        avatarForceRefresh={controller.avatarForceRefresh}
        onAvatarUpload={controller.handleAvatarUpload}
        realtimeConnected={controller.realtimeConnected}
      />
    </div>
  );
}
