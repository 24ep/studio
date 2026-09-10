"use client";

import React from "react";

import { cn } from "@/lib/utils";
import { ApplicantHeaderActions } from "./ApplicantHeaderActions";
import { ApplicantHeaderAvatar } from "./ApplicantHeaderAvatar";
import {
  ApplicantAvatarDialog,
  ApplicantIdentityBlock,
} from "./ApplicantHeaderParts";
import type { ApplicantHeaderProps } from "./ApplicantHeaderTypes";
import { useApplicantHeader } from "./use-applicant-header";

export const ApplicantHeader: React.FC<ApplicantHeaderProps> = ({
  applicant,
  isModal,
  isEditing,
  availableStages,
  onEditClick,
  onManageTransitions,
  onReprocess,
  onGenerativeAI,
  onEvaluate,
  onCreateEmployee,
  isCreatingEmployee,
  onSendInterviewInvitation,
  onDelete,
  onTogglePin,
  onToggleBlacklist,
  onToggleRead,
  avatarInputRef,
  avatarUploading,
  avatarError,
  avatarForceRefresh,
  onAvatarUpload,
}) => {
  const header = useApplicantHeader(applicant, isModal);

  return (
    <div
      className={cn(
        "sticky border-b border-border bg-background pointer-events-auto",
        isModal ? "px-[24px] py-[19px]" : "p-4",
        header.headerTopClass,
      )}
      style={{ zIndex: header.contentZIndex }}
    >
      <div className={cn(
        "relative grid grid-cols-1 gap-5 lg:grid-cols-10 lg:items-center lg:gap-6",
      )}>
        <div className="lg:col-span-8">
          <div className="flex items-start gap-3 sm:items-center sm:gap-5">
            <ApplicantHeaderAvatar
              applicant={applicant}
              avatarError={avatarError}
              avatarForceRefresh={avatarForceRefresh}
              avatarInputRef={avatarInputRef}
              avatarUploading={avatarUploading}
              isEditing={isEditing}
              isMobile={header.isMobile}
              reviewMode={isModal}
              onAvatarClick={header.handleAvatarClick}
              onAvatarUpload={onAvatarUpload}
            />
            <ApplicantIdentityBlock
              applicant={applicant}
              nameInfo={header.nameInfo}
              onManageTransitions={onManageTransitions}
              reviewMode={isModal}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-end gap-4">
            <ApplicantHeaderActions
              applicant={applicant}
              availableStages={availableStages}
              contentZIndex={header.contentZIndex}
              isEditing={isEditing}
              onDelete={onDelete}
              onEditClick={onEditClick}
              onCreateEmployee={onCreateEmployee}
              onEvaluate={onEvaluate}
              onGenerativeAI={onGenerativeAI}
              isCreatingEmployee={isCreatingEmployee}
              onManageTransitions={onManageTransitions}
              onReprocess={onReprocess}
              onSendInterviewInvitation={onSendInterviewInvitation}
              onToggleBlacklist={onToggleBlacklist}
              onTogglePin={onTogglePin}
              onToggleRead={onToggleRead}
              reviewMode={isModal}
            />
          </div>
        </div>
      </div>

      <ApplicantAvatarDialog
        applicant={applicant}
        avatarImageUrl={header.avatarImageUrl}
        contentZIndex={header.contentZIndex}
        onOpenChange={header.setIsAvatarModalOpen}
        open={header.isAvatarModalOpen}
      />
    </div>
  );
};
