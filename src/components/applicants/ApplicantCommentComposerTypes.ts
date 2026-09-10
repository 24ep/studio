import type { ChangeEvent, RefObject } from "react";
import type { ApplicantCommentChannel } from "./applicant-comments-utils";

export type ApplicantCommentComposerProps = {
  selectedChannel: ApplicantCommentChannel;
  onChannelChange: (channel: ApplicantCommentChannel) => void;
  canViewAllComments: boolean;
  canViewRemarksOnly: boolean;
  canViewActivities: boolean;
  files: File[];
  labels: string[];
  newComment: string;
  saving: boolean;
  error: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  onCommentChange: (value: string) => void;
  onLabelChange: (index: number, value: string) => void;
  onRemoveFile: (index: number) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenReminder: () => void;
  onSubmit: () => void;
};
