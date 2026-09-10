import type { Applicant } from "@/lib/types";

export interface MobileApplicantNameInfo {
  fontClass: string;
  lang: string;
}

export interface MobileApplicantStageOption {
  id: string;
  name: string;
}

export interface MobileApplicantRecruiterOption {
  id: string;
  name: string;
}

export interface MobileApplicantActionDialogsProps {
  applicant: Applicant;
  nameInfo: MobileApplicantNameInfo;
  isActionsModalOpen: boolean;
  onActionsModalOpenChange: (open: boolean) => void;
  isStatusModalOpen: boolean;
  onStatusModalOpenChange: (open: boolean) => void;
  isRecruiterModalOpen: boolean;
  onRecruiterModalOpenChange: (open: boolean) => void;
  availableStages: MobileApplicantStageOption[];
  newStatus: string;
  onNewStatusChange: (statusId: string) => void;
  transitionNotes: string;
  onTransitionNotesChange: (notes: string) => void;
  onChangeStatus: () => void;
  availableRecruiters: MobileApplicantRecruiterOption[];
  newRecruiterId: string | null;
  onNewRecruiterIdChange: (recruiterId: string) => void;
  onAssignRecruiter: () => void;
  isCreatingEmployee: boolean;
  onCreateEmployee: () => void;
  onTogglePin: () => void;
  onRefresh: () => void;
  onRequestDelete: () => void;
}
