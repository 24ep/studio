import type {
  CombinedActivityItem,
  CommentAttachmentPreview,
} from './applicant-comments-utils';

export interface ApplicantCommentsTimelineProps {
  combinedActivities: CombinedActivityItem[];
  logsLoading: boolean;
  editingId: string | null;
  editingContent: string;
  editingSaving: string | null;
  deleteLoading: string | null;
  isEditing: boolean;
  hasMoreItems: boolean;
  isLoadingMore: boolean;
  onEditingContentChange: (value: string) => void;
  onStartEdit: (itemId: string, content: string) => void;
  onCancelEdit: () => void;
  onEditComment: (itemId: string) => void;
  onDeleteComment: (itemId: string) => void;
  onFileClick: (attachment: CommentAttachmentPreview) => void;
  onLoadMoreItems: () => void;
}

export interface ApplicantCommentsTimelineItemProps {
  item: CombinedActivityItem;
  isLast: boolean;
  editingId: string | null;
  editingContent: string;
  editingSaving: string | null;
  deleteLoading: string | null;
  isEditing: boolean;
  onEditingContentChange: (value: string) => void;
  onStartEdit: (itemId: string, content: string) => void;
  onCancelEdit: () => void;
  onEditComment: (itemId: string) => void;
  onDeleteComment: (itemId: string) => void;
  onFileClick: (attachment: CommentAttachmentPreview) => void;
}

export interface ApplicantTimelineItemHeaderProps {
  item: CombinedActivityItem;
  editingId: string | null;
  editingSaving: string | null;
  deleteLoading: string | null;
  isEditing: boolean;
  onStartEdit: (itemId: string, content: string) => void;
  onCancelEdit: () => void;
  onEditComment: (itemId: string) => void;
  onDeleteComment: (itemId: string) => void;
}

export type ApplicantCommentActionsProps = ApplicantTimelineItemHeaderProps;

export interface ApplicantCommentTimelineContentProps {
  item: CombinedActivityItem;
  editingId: string | null;
  editingContent: string;
  onEditingContentChange: (value: string) => void;
  onFileClick: (attachment: CommentAttachmentPreview) => void;
}

export interface ApplicantCommentAttachmentsProps {
  item: CombinedActivityItem;
  onFileClick: (attachment: CommentAttachmentPreview) => void;
}
