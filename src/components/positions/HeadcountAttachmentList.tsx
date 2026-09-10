"use client";

import { format } from 'date-fns';
import { Download, Eye, FileText, Loader2, Paperclip, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Attachment, Headcount } from '@/lib/types';
import { HeadcountAttachmentFileIcon } from './HeadcountAttachmentFileIcon';

interface HeadcountAttachmentListProps {
  attachments: Headcount['attachments'];
  deleting: string | null;
  onPreview: (attachment: Attachment) => void;
  onDownload: (attachment: Attachment) => void;
  onDelete: (attachmentId: string) => void;
}

export function HeadcountAttachmentList({
  attachments,
  deleting,
  onPreview,
  onDownload,
  onDelete,
}: HeadcountAttachmentListProps) {
  const attachmentCount = attachments?.length || 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <h3 className="font-medium">Attachments ({attachmentCount})</h3>
          </div>

          {!attachments || attachments.length === 0 ? (
            <HeadcountAttachmentEmptyState />
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <HeadcountAttachmentRow
                  key={attachment.id}
                  attachment={attachment}
                  deleting={deleting}
                  onPreview={onPreview}
                  onDownload={onDownload}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HeadcountAttachmentEmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No attachments uploaded yet</p>
      <p className="text-sm">Upload files using the form above</p>
    </div>
  );
}

function HeadcountAttachmentRow({
  attachment,
  deleting,
  onPreview,
  onDownload,
  onDelete,
}: {
  attachment: Attachment;
  deleting: string | null;
  onPreview: (attachment: Attachment) => void;
  onDownload: (attachment: Attachment) => void;
  onDelete: (attachmentId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <HeadcountAttachmentFileIcon fileName={attachment.fileName} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{attachment.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {attachment.label} - {format(new Date(attachment.uploadedAt), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onPreview(attachment)} title="Preview">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDownload(attachment)} title="Download">
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(attachment.id)}
          disabled={deleting === attachment.id}
          title="Delete"
        >
          {deleting === attachment.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
