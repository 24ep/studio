"use client";

import { ApplicantCommentAttachmentList, getApplicantCommentFileIcon } from "./ApplicantCommentAttachmentList";
import { ApplicantCommentChannelSelect } from "./ApplicantCommentChannelSelect";
import { ApplicantCommentEditorActions } from "./ApplicantCommentEditorActions";
import type { ApplicantCommentComposerProps } from "./ApplicantCommentComposerTypes";

export { getApplicantCommentFileIcon };

export function ApplicantCommentComposer({
  selectedChannel,
  onChannelChange,
  canViewAllComments,
  canViewRemarksOnly,
  canViewActivities,
  files,
  labels,
  newComment,
  saving,
  error,
  fileInputRef,
  onCommentChange,
  onLabelChange,
  onRemoveFile,
  onFileChange,
  onOpenReminder,
  onSubmit,
}: ApplicantCommentComposerProps) {
  const hasFiles = Array.isArray(files) && files.length > 0;
  const canSubmit = newComment.trim() || hasFiles;

  return (
    <>
      <ApplicantCommentChannelSelect
        selectedChannel={selectedChannel}
        onChannelChange={onChannelChange}
        canViewAllComments={canViewAllComments}
        canViewRemarksOnly={canViewRemarksOnly}
        canViewActivities={canViewActivities}
      />

      <div className="border rounded-lg bg-background flex-shrink-0">
        {hasFiles && (
          <ApplicantCommentAttachmentList
            files={files}
            labels={labels}
            onLabelChange={onLabelChange}
            onRemoveFile={onRemoveFile}
          />
        )}

        <ApplicantCommentEditorActions
          canSubmit={canSubmit}
          error={error}
          fileInputRef={fileInputRef}
          newComment={newComment}
          saving={saving}
          onCommentChange={onCommentChange}
          onFileChange={onFileChange}
          onOpenReminder={onOpenReminder}
          onSubmit={onSubmit}
        />
      </div>
    </>
  );
}
