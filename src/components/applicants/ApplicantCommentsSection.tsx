import React, { useState } from 'react';
import { FileViewerModal } from '../ui/file-viewer-modal';
import { ApplicantCommentComposer } from './ApplicantCommentComposer';
import { ApplicantCommentsTimeline } from './ApplicantCommentsTimeline';
import { ApplicantReminderDialog } from './ApplicantReminderDialog';
import { ApplicantCommentsSubTabs } from './ApplicantCommentsSubTabs';
import type { ApplicantCommentItem } from './applicant-comments-utils';
import { useApplicantCommentsActivityFeed } from './hooks/use-applicant-comments-activity-feed';
import { useApplicantCommentFileState } from './hooks/use-applicant-comment-file-state';
import { useApplicantCommentMutations } from './hooks/use-applicant-comment-mutations';
import { useApplicantCommentsPermissions } from './hooks/use-applicant-comments-permissions';
import {
  useApplicantReminders,
  type ApplicantCommentsCounts,
} from './hooks/use-applicant-reminders';

export interface ApplicantCommentsSectionProps {
  applicantId: string;
  comments: ApplicantCommentItem[];
  isEditing: boolean;
  onCommentsChange: () => void;
}

const ApplicantCommentsSection: React.FC<ApplicantCommentsSectionProps> = ({
  applicantId,
  comments: initialComments,
  isEditing,
  onCommentsChange,
}) => {
  const [newComment, setNewComment] = useState('');
  const [counts, setCounts] = useState<ApplicantCommentsCounts>({
    all: 0,
    comment: 0,
    remark: 0,
    activity: 0,
  });

  const permissions = useApplicantCommentsPermissions();
  const {
    creatingReminder,
    handleCreateReminder,
    isReminderDialogOpen,
    reminderDate,
    reminderTime,
    reminderTitle,
    reminders,
    setIsReminderDialogOpen,
    setReminderDate,
    setReminderTime,
    setReminderTitle,
  } = useApplicantReminders({
    applicantId,
    setCounts,
    onCommentsChange,
  });

  const activityFeed = useApplicantCommentsActivityFeed({
    applicantId,
    activeSubTab: permissions.activeSubTab,
    initialComments,
    reminders,
    setCounts,
  });

  const fileState = useApplicantCommentFileState(applicantId);
  const mutations = useApplicantCommentMutations({
    applicantId,
    clearFiles: fileState.clearFiles,
    comments: activityFeed.comments,
    files: Array.isArray(fileState.files) ? fileState.files : [],
    labels: Array.isArray(fileState.labels) ? fileState.labels : [],
    newComment,
    onCommentsChange,
    refreshFirstCommentsPage: activityFeed.refreshFirstCommentsPage,
    selectedChannel: permissions.selectedChannel,
    setComments: activityFeed.setComments,
    setNewComment,
  });

  return (
    <div className="h-full flex flex-col min-h-0 p-4">
      <ApplicantCommentsSubTabs
        activeTab={permissions.activeSubTab}
        counts={counts}
        canViewAllComments={permissions.canViewAllComments}
        canViewRemarksOnly={permissions.canViewRemarksOnly}
        canViewActivities={permissions.canViewActivities}
        onTabChange={(tab, channel) => {
          permissions.setActiveSubTab(tab);
          permissions.setSelectedChannel(channel);
        }}
      />

      <div className="flex-1 overflow-y-auto space-y-0">
        <ApplicantCommentsTimeline
          combinedActivities={activityFeed.combinedActivities}
          logsLoading={activityFeed.logsLoading}
          editingId={mutations.editingId}
          editingContent={mutations.editingContent}
          editingSaving={mutations.editingSaving}
          deleteLoading={mutations.deleteLoading}
          isEditing={isEditing}
          hasMoreItems={activityFeed.hasMoreItems}
          isLoadingMore={activityFeed.isLoadingMore}
          onEditingContentChange={mutations.setEditingContent}
          onStartEdit={mutations.handleStartEdit}
          onCancelEdit={mutations.handleCancelEdit}
          onEditComment={mutations.handleEditComment}
          onDeleteComment={mutations.handleDeleteComment}
          onFileClick={fileState.handleFileClick}
          onLoadMoreItems={activityFeed.loadMoreItems}
        />
      </div>

      <ApplicantCommentComposer
        selectedChannel={permissions.selectedChannel}
        onChannelChange={(value) => {
          permissions.setSelectedChannel(value);
          permissions.setActiveSubTab(value);
        }}
        canViewAllComments={permissions.canViewAllComments}
        canViewRemarksOnly={permissions.canViewRemarksOnly}
        canViewActivities={permissions.canViewActivities}
        files={Array.isArray(fileState.files) ? fileState.files : []}
        labels={Array.isArray(fileState.labels) ? fileState.labels : []}
        newComment={newComment}
        saving={mutations.saving}
        error={mutations.error}
        fileInputRef={fileState.fileInputRef}
        onCommentChange={setNewComment}
        onLabelChange={fileState.handleLabelChange}
        onRemoveFile={fileState.handleRemoveFile}
        onFileChange={fileState.handleFileChange}
        onOpenReminder={() => setIsReminderDialogOpen(true)}
        onSubmit={mutations.handleAddComment}
      />

      <FileViewerModal
        isOpen={fileState.isFileViewerOpen}
        onOpenChange={fileState.setIsFileViewerOpen}
        file={fileState.selectedFile}
      />

      <ApplicantReminderDialog
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
        title={reminderTitle}
        onTitleChange={setReminderTitle}
        date={reminderDate}
        onDateChange={setReminderDate}
        time={reminderTime}
        onTimeChange={setReminderTime}
        isCreating={creatingReminder}
        onCreate={handleCreateReminder}
      />
    </div>
  );
};

export default ApplicantCommentsSection;
