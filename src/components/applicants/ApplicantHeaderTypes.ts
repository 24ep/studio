import type React from "react";

import type {
  Applicant,
  RecruitmentStage,
} from "@/lib/types";

export interface ApplicantHeaderProps {
  applicant: Applicant;
  isModal?: boolean;
  onClose?: () => void;
  isEditing: boolean;
  availableStages: RecruitmentStage[];
  onEditClick: () => void;
  onManageTransitions: () => void;
  onReprocess: () => void;
  onGenerativeAI: () => void;
  onEvaluate: () => void;
  onCreateEmployee?: () => void;
  isCreatingEmployee?: boolean;
  onSendInterviewInvitation?: () => void;
  onDelete: () => void;
  onTogglePin?: () => void;
  onToggleBlacklist: () => void;
  onToggleRead?: () => void;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  avatarUploading: boolean;
  avatarError: string | null;
  avatarForceRefresh: boolean;
  onAvatarUpload: (file: File) => void;
  realtimeConnected?: boolean;
}
