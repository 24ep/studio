"use client";

import { MobileApplicantActionsSheet } from "./MobileApplicantActionsSheet";
import { MobileApplicantRecruiterDialog } from "./MobileApplicantRecruiterDialog";
import { MobileApplicantStatusDialog } from "./MobileApplicantStatusDialog";
import type { MobileApplicantActionDialogsProps } from "./MobileApplicantActionDialogsTypes";

export function MobileApplicantActionDialogs({
  applicant,
  nameInfo,
  isActionsModalOpen,
  onActionsModalOpenChange,
  isStatusModalOpen,
  onStatusModalOpenChange,
  isRecruiterModalOpen,
  onRecruiterModalOpenChange,
  availableStages,
  newStatus,
  onNewStatusChange,
  transitionNotes,
  onTransitionNotesChange,
  onChangeStatus,
  availableRecruiters,
  newRecruiterId,
  onNewRecruiterIdChange,
  onAssignRecruiter,
  isCreatingEmployee,
  onCreateEmployee,
  onTogglePin,
  onRefresh,
  onRequestDelete,
}: MobileApplicantActionDialogsProps) {
  return (
    <>
      <MobileApplicantActionsSheet
        applicant={applicant}
        nameInfo={nameInfo}
        isActionsModalOpen={isActionsModalOpen}
        onActionsModalOpenChange={onActionsModalOpenChange}
        onStatusModalOpenChange={onStatusModalOpenChange}
        onRecruiterModalOpenChange={onRecruiterModalOpenChange}
        isCreatingEmployee={isCreatingEmployee}
        onCreateEmployee={onCreateEmployee}
        onTogglePin={onTogglePin}
        onRequestDelete={onRequestDelete}
      />
      <MobileApplicantStatusDialog
        isStatusModalOpen={isStatusModalOpen}
        onStatusModalOpenChange={onStatusModalOpenChange}
        availableStages={availableStages}
        newStatus={newStatus}
        onNewStatusChange={onNewStatusChange}
        transitionNotes={transitionNotes}
        onTransitionNotesChange={onTransitionNotesChange}
        onChangeStatus={onChangeStatus}
      />
      <MobileApplicantRecruiterDialog
        isRecruiterModalOpen={isRecruiterModalOpen}
        onRecruiterModalOpenChange={onRecruiterModalOpenChange}
        availableRecruiters={availableRecruiters}
        newRecruiterId={newRecruiterId}
        onNewRecruiterIdChange={onNewRecruiterIdChange}
        onAssignRecruiter={onAssignRecruiter}
      />
    </>
  );
}
