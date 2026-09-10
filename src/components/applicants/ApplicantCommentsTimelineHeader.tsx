"use client";

import {
  PencilIcon,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';

import { Button } from '../ui/button';

import {
  getApplicantActivityAuthorName,
  getCombinedApplicantActivityDate,
} from './applicant-comments-utils';
import { ApplicantActivityTypeBadge } from './ApplicantCommentsTimelineDecor';
import type {
  ApplicantCommentActionsProps,
  ApplicantTimelineItemHeaderProps,
} from './ApplicantCommentsTimelineTypes';

export function ApplicantTimelineItemHeader({
  item,
  editingId,
  editingSaving,
  deleteLoading,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onEditComment,
  onDeleteComment,
}: ApplicantTimelineItemHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-1">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{getApplicantActivityAuthorName(item)}</span>
        <ApplicantActivityTypeBadge item={item} />
        <span className="text-xs text-muted-foreground">&bull;</span>
        <span className="text-xs text-muted-foreground">
          {new Date(getCombinedApplicantActivityDate(item)).toLocaleString()}
        </span>
      </div>
      {item.type === 'comment' && (
        <ApplicantCommentActions
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
      )}
    </div>
  );
}

function ApplicantCommentActions({
  item,
  editingId,
  editingSaving,
  deleteLoading,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onEditComment,
  onDeleteComment,
}: ApplicantCommentActionsProps) {
  if (editingId === item.id) {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEditComment(item.id)}
          disabled={editingSaving === item.id}
        >
          {editingSaving === item.id ? 'Saving...' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancelEdit}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onStartEdit(item.id, item.content || '')}
        className="p-1 h-auto hover:bg-primary/10"
        title="Edit comment"
      >
        <PencilIcon className="h-4 w-4 text-muted-foreground hover:text-primary" />
      </Button>
      {isEditing && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDeleteComment(item.id)}
          disabled={deleteLoading === item.id}
          className="text-destructive hover:text-destructive p-1 h-auto"
          title="Delete comment"
        >
          {deleteLoading === item.id ? <span className="text-xs">...</span> : <X className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
