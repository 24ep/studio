import {
  ArrowUpTrayIcon as UploadCloud,
  DocumentIcon as FileIcon,
  DocumentTextIcon as FileTextIcon,
  PhotoIcon as ImageIcon,
  StarIcon,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { ApplicantAttachment } from './applicant-attachment-utils';
import {
  buildApplicantAttachmentPreviewUrl,
  isImageAttachment,
  isPdfAttachment,
} from './applicant-resumes-section-utils';

interface ApplicantResumesToolbarProps {
  sortDesc: boolean;
  uploading: boolean;
  onOpenUpload: () => void;
  onToggleSort: () => void;
}

interface ApplicantResumesListProps {
  attachments: ApplicantAttachment[];
  isEditing: boolean;
  onDelete: (attachmentId: string) => void;
  onFileClick: (attachment: ApplicantAttachment) => void;
  onSetPrimary: (attachmentId: string) => void;
}

function ApplicantAttachmentIcon({ fileName }: { fileName: string }) {
  if (isPdfAttachment(fileName)) {
    return <FileTextIcon className="w-6 h-6 text-red-500" />;
  }

  return <FileIcon className="w-6 h-6 text-gray-500" />;
}

export function ApplicantResumesToolbar({
  sortDesc,
  uploading,
  onOpenUpload,
  onToggleSort,
}: ApplicantResumesToolbarProps) {
  return (
    <div className="flex justify-between items-center mb-2 flex-shrink-0">
      <span className="font-semibold">Attachments</span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenUpload}
          disabled={uploading}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload
        </Button>
        <Button size="sm" variant="outline" onClick={onToggleSort}>
          Sort by Date {sortDesc ? 'Down' : 'Up'}
        </Button>
      </div>
    </div>
  );
}

export function ApplicantResumesList({
  attachments,
  isEditing,
  onDelete,
  onFileClick,
  onSetPrimary,
}: ApplicantResumesListProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-3">
      {attachments.length === 0 && (
        <div className="text-muted-foreground text-sm text-center py-8">
          No attachments uploaded yet.
          <p className="text-xs mt-2">Click the upload button above to add attachments</p>
        </div>
      )}

      {attachments.map((attachment) => (
        <ApplicantResumeRow
          key={attachment.id}
          attachment={attachment}
          isEditing={isEditing}
          onDelete={onDelete}
          onFileClick={onFileClick}
          onSetPrimary={onSetPrimary}
        />
      ))}
    </div>
  );
}

function ApplicantResumeRow({
  attachment,
  isEditing,
  onDelete,
  onFileClick,
  onSetPrimary,
}: {
  attachment: ApplicantAttachment;
  isEditing: boolean;
  onDelete: (attachmentId: string) => void;
  onFileClick: (attachment: ApplicantAttachment) => void;
  onSetPrimary: (attachmentId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border rounded px-3 py-2 bg-muted/50 hover:bg-muted/70 transition-colors">
      {isImageAttachment(attachment.fileName) ? (
        <img
          src={buildApplicantAttachmentPreviewUrl(attachment.url)}
          alt={attachment.fileName}
          className="w-6 h-6 object-cover rounded"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <ApplicantAttachmentIcon fileName={attachment.fileName} />
      )}
      <button
        type="button"
        onClick={() => onFileClick(attachment)}
        className="font-medium text-xs hover:underline text-left flex-1 min-w-0 truncate"
      >
        {attachment.fileName}
      </button>
      {attachment.label && (
        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border">{attachment.label}</span>
      )}
      {attachment.isPrimary && (
        <Badge variant="default" className="text-xs">Primary</Badge>
      )}
      <div className="flex gap-1 flex-shrink-0">
        {isEditing && !attachment.isPrimary && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => onSetPrimary(attachment.id)}
            title="Set as primary"
          >
            <StarIcon className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(attachment.id)}
          title="Delete attachment"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
