export type ApplicantCommentsTab = 'all' | 'comment' | 'remark' | 'activity';
export type ApplicantCommentChannel = 'comment' | 'remark' | 'activity';

export interface CombinedActivityItem {
  id: string;
  type: 'comment' | 'activity';
  rawType?: string;
  content?: string;
  action?: string;
  user?: string;
  note?: string;
  author?: { name: string } | string;
  createdAt?: string;
  time?: string;
  attachments?: CommentAttachmentPreview[];
}

export interface CommentAttachmentPreview {
  id?: string;
  fileName: string;
  url: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number;
  filePath?: string;
  applicantId?: string;
}

export interface ApplicantCommentItem {
  id?: string;
  type?: ApplicantCommentChannel;
  content?: string;
  author?: { name: string } | string;
  createdAt?: string;
  attachments?: unknown;
}

export interface ApplicantActivityLogItem {
  id?: string;
  action?: string;
  user?: string;
  note?: string;
  time?: string;
  attachments?: unknown;
}

export interface ApplicantReminderItem {
  id?: string;
  title?: string;
  content?: string;
  reminderDate?: string;
  user?: { name?: string | null } | null;
}
