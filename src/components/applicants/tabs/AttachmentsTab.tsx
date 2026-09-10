"use client";

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { FileViewerModal } from '@/components/ui/file-viewer-modal';
import type { FileViewerFile } from '@/components/ui/file-viewer-modal-types';
import { sanitizeUrl } from '@/lib/utils';
import {
  AttachmentsEmptyState,
  AttachmentsList,
  AttachmentUploadCard,
} from './AttachmentsTabParts';
import type { Attachment, AttachmentsTabProps } from './attachments-tab-types';
import { buildAttachmentViewerFile } from './attachments-tab-utils';

export function AttachmentsTab({
  applicantId,
  attachments,
  onRefresh,
  canUpload = false,
  canDelete = false,
}: AttachmentsTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileViewerFile | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(
        `/api/applicants/${applicantId}/resumes/${attachment.id}/download`,
      );
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      try {
        const safeUrl = sanitizeUrl(objectUrl);
        if (!safeUrl) {
          throw new Error('Invalid download URL');
        }

        const link = document.createElement('a');
        link.href = safeUrl;
        link.download = attachment.fileName;
        link.click();
      } finally {
        window.URL.revokeObjectURL(objectUrl);
      }

      toast.success('File downloaded successfully');
    } catch {
      toast.error('Failed to download file');
    }
  };

  const handleView = (attachment: Attachment) => {
    setSelectedFile(buildAttachmentViewerFile(attachment, applicantId));
    setIsFileViewerOpen(true);
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setDeletingId(attachmentId);
    try {
      const response = await fetch(
        `/api/applicants/${applicantId}/resumes/${attachmentId}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      toast.success('File deleted successfully');
      onRefresh?.();
    } catch {
      toast.error('Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    const selectedFiles = Array.from(files);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));

    try {
      const response = await fetch(`/api/applicants/${applicantId}/resumes`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
      onRefresh?.();
    } catch {
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4 p-4">
      {canUpload && (
        <AttachmentUploadCard
          isUploading={isUploading}
          onUpload={handleUpload}
        />
      )}

      {attachments.length === 0 ? (
        <AttachmentsEmptyState />
      ) : (
        <AttachmentsList
          attachments={attachments}
          canDelete={canDelete}
          deletingId={deletingId}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onView={handleView}
        />
      )}

      <FileViewerModal
        isOpen={isFileViewerOpen}
        onOpenChange={setIsFileViewerOpen}
        file={selectedFile}
      />
    </div>
  );
}
