"use client";

import { Dialog } from "@/components/ui/dialog";
import type { Applicant, ApplicantStatus, RecruitmentStage } from "@/lib/types";
import { ManageTransitionsDialogContent } from "./ManageTransitionsModalParts";
import { useManageTransitionsModal } from "./use-manage-transitions-modal";

interface ManageTransitionsModalProps {
  applicant: Applicant | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateApplicant: (
    applicantId: string,
    status: ApplicantStatus,
    notes?: string,
    suppressToast?: boolean,
  ) => Promise<boolean | undefined>;
  onRefreshApplicantData: (applicantId: string) => Promise<void>;
  availableStages: RecruitmentStage[];
  preselectedStage?: string | null;
  onCommentsChange: () => void;
}

export function ManageTransitionsModal({
  applicant,
  isOpen,
  onOpenChange,
  onUpdateApplicant,
  onRefreshApplicantData,
  availableStages,
  preselectedStage,
  onCommentsChange,
}: ManageTransitionsModalProps) {
  const modal = useManageTransitionsModal({
    applicant,
    availableStages,
    isOpen,
    onCommentsChange,
    onOpenChange,
    onRefreshApplicantData,
    onUpdateApplicant,
    preselectedStage,
  });

  if (!applicant) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={modal.handleModalOpenChange}
    >
      <ManageTransitionsDialogContent
        applicantName={applicant.name}
        currentStageName={modal.currentStageName}
        form={modal.form}
        isSaving={modal.isSaving}
        onCancel={modal.handleCancelClick}
        onSave={modal.handleSaveClick}
        stages={modal.stages}
      />
    </Dialog>
  );
}
