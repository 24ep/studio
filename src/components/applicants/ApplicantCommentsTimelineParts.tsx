"use client";

import { ChevronDownIcon as ChevronDown } from '@heroicons/react/24/outline';

import { Button } from '../ui/button';

import {
  ApplicantActivityTimelineContent,
  ApplicantCommentTimelineContent,
} from './ApplicantCommentsTimelineContent';
import { ApplicantActivityIcon } from './ApplicantCommentsTimelineDecor';
import { ApplicantTimelineItemHeader } from './ApplicantCommentsTimelineHeader';
import type { ApplicantCommentsTimelineItemProps } from './ApplicantCommentsTimelineTypes';

export function ApplicantCommentsTimelineItem({
  item,
  isLast,
  editingId,
  editingContent,
  editingSaving,
  deleteLoading,
  isEditing,
  onEditingContentChange,
  onStartEdit,
  onCancelEdit,
  onEditComment,
  onDeleteComment,
  onFileClick,
}: ApplicantCommentsTimelineItemProps) {
  return (
    <div className={`py-2 ${!isLast ? 'border-b border-border' : ''}`}>
      <div className="flex gap-3">
        <ApplicantActivityIcon item={item} />
        <div className="flex-1 min-w-0">
          <ApplicantTimelineItemHeader
            item={item}
            editingId={editingId}
            editingSaving={editingSaving}
            deleteLoading={deleteLoading}
            isEditing={isEditing}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />
          {item.type === 'comment' ? (
            <ApplicantCommentTimelineContent
              item={item}
              editingId={editingId}
              editingContent={editingContent}
              onEditingContentChange={onEditingContentChange}
              onFileClick={onFileClick}
            />
          ) : (
            <ApplicantActivityTimelineContent item={item} onFileClick={onFileClick} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ApplicantCommentsLoadMoreButton({
  isLoadingMore,
  onLoadMoreItems,
}: {
  isLoadingMore: boolean;
  onLoadMoreItems: () => void;
}) {
  return (
    <div className="flex justify-center py-4">
      <Button
        onClick={onLoadMoreItems}
        disabled={isLoadingMore}
        variant="outline"
        size="sm"
        className="w-full max-w-xs"
      >
        {isLoadingMore ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
            Loading more...
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 mr-2" />
            Load more
          </>
        )}
      </Button>
    </div>
  );
}
