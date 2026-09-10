"use client";

import {
  ApplicantCommentsLoadMoreButton,
  ApplicantCommentsTimelineItem,
} from './ApplicantCommentsTimelineParts';
import type { ApplicantCommentsTimelineProps } from './ApplicantCommentsTimelineTypes';

export function ApplicantCommentsTimeline({
  combinedActivities,
  logsLoading,
  editingId,
  editingContent,
  editingSaving,
  deleteLoading,
  isEditing,
  hasMoreItems,
  isLoadingMore,
  onEditingContentChange,
  onStartEdit,
  onCancelEdit,
  onEditComment,
  onDeleteComment,
  onFileClick,
  onLoadMoreItems,
}: ApplicantCommentsTimelineProps) {
  if (logsLoading) {
    return <div className="text-muted-foreground text-sm py-4 text-center">Loading activities...</div>;
  }

  if (combinedActivities.length === 0) {
    return <div className="text-muted-foreground text-sm py-4 text-center">No activities or comments yet.</div>;
  }

  return (
    <>
      {combinedActivities.map((item, index) => (
        <ApplicantCommentsTimelineItem
          key={item.id}
          item={item}
          isLast={index === combinedActivities.length - 1}
          editingId={editingId}
          editingContent={editingContent}
          editingSaving={editingSaving}
          deleteLoading={deleteLoading}
          isEditing={isEditing}
          onEditingContentChange={onEditingContentChange}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          onFileClick={onFileClick}
        />
      ))}

      {hasMoreItems && (
        <ApplicantCommentsLoadMoreButton
          isLoadingMore={isLoadingMore}
          onLoadMoreItems={onLoadMoreItems}
        />
      )}
    </>
  );
}
