import React from "react";

import { UserAvatarUpload } from "@/components/ui/user-avatar-upload";
import type { Applicant } from "@/lib/types";

interface ApplicantHeaderAvatarProps {
  applicant: Applicant;
  avatarError: string | null;
  avatarForceRefresh: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  avatarUploading: boolean;
  isEditing: boolean;
  isMobile: boolean;
  reviewMode?: boolean;
  onAvatarClick: React.MouseEventHandler<HTMLDivElement>;
  onAvatarUpload: (file: File) => void | Promise<void>;
}

export function ApplicantHeaderAvatar({
  applicant,
  avatarUploading,
  isEditing,
  reviewMode = false,
  onAvatarUpload,
}: ApplicantHeaderAvatarProps) {
  return (
    <UserAvatarUpload
      user={applicant}
      onFileUpload={async file => {
        await onAvatarUpload(file);
      }}
      onImageUpload={async () => undefined}
      disabled={avatarUploading || isEditing}
      size={reviewMode ? "review" : "md"}
      circularBorderless
    />
  );
}
