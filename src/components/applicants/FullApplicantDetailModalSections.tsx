import { FullApplicantDetailEditActions } from "./FullApplicantDetailEditActions";
import { FullApplicantDetailFooterActions } from "./FullApplicantDetailFooterActions";
import { FullApplicantDetailModals } from "./FullApplicantDetailModals";
import type { FullApplicantDetailSectionProps } from "./FullApplicantDetailViewTypes";

export function FullApplicantOverlayModals({
  controller,
}: FullApplicantDetailSectionProps) {
  return (
    <FullApplicantDetailModals
      applicant={controller.applicant}
      allDbPositions={controller.allDbPositions}
      appLogoUrl={controller.appLogoUrl}
      availableStages={controller.availableStages}
      headcountWarningData={controller.headcountWarningData}
      isCreateEvalLinkModalOpen={controller.isCreateEvalLinkModalOpen}
      isDeleting={controller.isDeleting}
      isDeleteModalOpen={controller.isDeleteModalOpen}
      isEditingEvalLink={controller.isEditingEvalLink}
      isGenerativeAIModalOpen={controller.isGenerativeAIModalOpen}
      isHeadcountWarningModalOpen={controller.isHeadcountWarningModalOpen}
      isJobMatchEnabled={controller.isJobMatchEnabled}
      isJobMatchModalOpen={controller.isJobMatchModalOpen}
      isMobile={controller.isMobile}
      isPositionDrawerOpen={controller.isPositionDrawerOpen}
      isQrModalOpen={controller.isQrModalOpen}
      isReprocessModalOpen={controller.isReprocessModalOpen}
      isSendInvitationModalOpen={controller.isSendInvitationModalOpen}
      isTransitionsModalOpen={controller.isTransitionsModalOpen}
      preselectedStage={controller.preselectedStage}
      qrData={controller.qrData}
      resumes={controller.resumes}
      selectedJobMatch={controller.selectedJobMatch}
      selectedPositionId={controller.selectedPositionId}
      onClearPreselectedStage={controller.clearPreselectedStage}
      onCommentsChange={controller.handleCommentsChange}
      onCopyEvaluationLink={controller.handleCopyEvaluationLink}
      onCreateEvalLinkModalOpenChange={controller.setIsCreateEvalLinkModalOpen}
      onDeleteConfirm={controller.handleDeleteApplicant}
      onDeleteModalOpenChange={controller.setIsDeleteModalOpen}
      onEditInterviewDetails={controller.handleEditInterviewDetails}
      onEditingEvalLinkChange={controller.setIsEditingEvalLink}
      onEvaluationLinkCreated={controller.handleEvaluationLinkCreated}
      onGenerativeAIModalOpenChange={controller.setIsGenerativeAIModalOpen}
      onHeadcountWarningClose={controller.closeHeadcountWarningModal}
      onInvalidEvaluationUrl={() => controller.toastError("Invalid URL")}
      onJobMatchModalClose={() => controller.setIsJobMatchModalOpen(false)}
      onPositionDrawerOpenChange={controller.setIsPositionDrawerOpen}
      onQrModalOpenChange={controller.setIsQrModalOpen}
      onRefresh={controller.onRefresh}
      onReprocessModalOpenChange={controller.setIsReprocessModalOpen}
      onSelectedPositionIdChange={controller.setSelectedPositionId}
      onSendInvitationModalOpenChange={controller.setIsSendInvitationModalOpen}
      onStatusUpdate={controller.handleStatusUpdate}
      onTransitionsModalOpenChange={controller.setIsTransitionsModalOpen}
    />
  );
}

export function FullApplicantDetailFloatingActions({
  controller,
}: FullApplicantDetailSectionProps) {
  return (
    <>
      <FullApplicantDetailEditActions
        isEditing={controller.isEditing}
        isSaving={controller.isSaving}
        onCancel={() => controller.setIsEditing(false)}
      />

      {!controller.isEditing && controller.applicant && controller.availableStages.length > 0 && (
        <FullApplicantDetailFooterActions
          applicant={controller.applicant}
          availableStages={controller.availableStages}
          isStatusUpdating={controller.isStatusUpdating}
          onStatusUpdate={controller.handleStatusUpdate}
          reviewMode={controller.isModal}
        />
      )}
    </>
  );
}
