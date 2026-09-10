"use client";

import { TiptapEditor } from '../ui/wysiwyg-editors';
import { sanitizeHtml, sanitizeUrl } from '@/lib/utils';

import { getApplicantCommentFileIcon } from './ApplicantCommentComposer';
import {
  getApplicantCommentAttachments,
} from './applicant-comments-utils';
import type {
  ApplicantCommentAttachmentsProps,
  ApplicantCommentTimelineContentProps,
} from './ApplicantCommentsTimelineTypes';

export function ApplicantCommentTimelineContent({
  item,
  editingId,
  editingContent,
  onEditingContentChange,
  onFileClick,
}: ApplicantCommentTimelineContentProps) {
  return (
    <>
      {editingId === item.id ? (
        <div className="space-y-2">
          <TiptapEditor
            value={editingContent}
            onChange={onEditingContentChange}
            placeholder="Edit your comment..."
            className="min-h-[60px]"
            showToolbar
          />
        </div>
      ) : (
        <div
          className="text-sm mb-2 prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content || '') }}
        />
      )}
      <ApplicantCommentAttachments item={item} onFileClick={onFileClick} />
    </>
  );
}

export function ApplicantActivityTimelineContent({
  item,
  onFileClick,
}: {
  item: ApplicantCommentTimelineContentProps['item'];
  onFileClick: ApplicantCommentTimelineContentProps['onFileClick'];
}) {
  return (
    <>
      <div className="text-sm">
        <span className="font-medium">{item.action}</span>
        {item.note && (
          <span
            className="ml-2 text-muted-foreground prose prose-sm dark:prose-invert inline-block max-w-none [&_p]:my-0 [&_p]:inline"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.note) }}
          />
        )}
      </div>
      <ApplicantCommentAttachments item={item} onFileClick={onFileClick} />
    </>
  );
}

function ApplicantCommentAttachments({
  item,
  onFileClick,
}: ApplicantCommentAttachmentsProps) {
  const attachments = getApplicantCommentAttachments(item);
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((attachment, attachmentIndex) => (
        <div key={attachment.id || attachmentIndex} className="flex items-center gap-2 border rounded px-2 py-1 bg-muted/50 hover:bg-muted/70 transition-colors">
          {attachment.fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
            <img src={sanitizeUrl(attachment.url)} alt={attachment.fileName} className="w-6 h-6 object-cover rounded" />
          ) : (
            getApplicantCommentFileIcon(attachment)
          )}
          <button
            type="button"
            onClick={() => onFileClick(attachment)}
            className="font-medium text-xs hover:underline text-left"
          >
            {attachment.fileName}
          </button>
          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border ml-1">{attachment.label}</span>
        </div>
      ))}
    </div>
  );
}
