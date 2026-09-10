import type { ChangeEvent } from 'react';
import { format } from 'date-fns';
import {
  ArrowDownTrayIcon as Download,
  ArrowPathIcon as Loader2,
  ArrowUpTrayIcon as Upload,
  DocumentIcon as FileIcon,
  DocumentTextIcon as FileText,
  EyeIcon as Eye,
  PhotoIcon as ImageIcon,
  TrashIcon as Trash2,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Attachment } from './attachments-tab-types';
import { getAttachmentFileType } from './attachments-tab-utils';

interface AttachmentUploadCardProps {
  isUploading: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function AttachmentUploadCard({
  isUploading,
  onUpload,
}: AttachmentUploadCardProps) {
  return (
    <Card className="p-4">
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Uploading...
              </span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Tap to upload files
              </span>
            </>
          )}
        </div>
      </label>
      <input
        id="file-upload"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={onUpload}
        className="hidden"
        disabled={isUploading}
      />
    </Card>
  );
}

export function AttachmentsEmptyState() {
  return (
    <div className="text-center py-12">
      <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground">No attachments yet</p>
    </div>
  );
}

interface AttachmentsListProps {
  attachments: Attachment[];
  canDelete: boolean;
  deletingId: string | null;
  onDelete: (attachmentId: string) => void;
  onDownload: (attachment: Attachment) => void;
  onView: (attachment: Attachment) => void;
}

export function AttachmentsList({
  attachments,
  canDelete,
  deletingId,
  onDelete,
  onDownload,
  onView,
}: AttachmentsListProps) {
  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <AttachmentCard
          key={attachment.id}
          attachment={attachment}
          canDelete={canDelete}
          deletingId={deletingId}
          onDelete={onDelete}
          onDownload={onDownload}
          onView={onView}
        />
      ))}
    </div>
  );
}

interface AttachmentCardProps extends Omit<AttachmentsListProps, 'attachments'> {
  attachment: Attachment;
}

function AttachmentCard({
  attachment,
  canDelete,
  deletingId,
  onDelete,
  onDownload,
  onView,
}: AttachmentCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <AttachmentFileIcon fileName={attachment.fileName} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">
            {attachment.fileName}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{format(new Date(attachment.uploadedAt), 'MMM d, yyyy')}</span>
          </div>
          {attachment.uploadedBy && (
            <p className="text-xs text-muted-foreground mt-1">
              Uploaded by{' '}
              {attachment.uploadedBy.name ||
                attachment.uploadedBy.email ||
                'Unknown'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onView(attachment)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDownload(attachment)}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(attachment.id)}
              disabled={deletingId === attachment.id}
              title="Delete"
            >
              {deletingId === attachment.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function AttachmentFileIcon({ fileName }: { fileName: string }) {
  const fileType = getAttachmentFileType(fileName);

  if (fileType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }

  if (fileType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }

  return <FileIcon className="h-5 w-5 text-gray-500" />;
}
