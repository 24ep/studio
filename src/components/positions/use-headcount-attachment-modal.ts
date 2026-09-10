"use client";

import { useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { sanitizeUrl } from '@/lib/security';
import type { Attachment, Headcount } from '@/lib/types';
import { getJsonErrorMessage, readJsonObject } from '@/lib/response-json';
import {
  buildHeadcountAttachmentDownloadUrl,
  createHeadcountAttachmentPreview,
  createSelectedHeadcountFilePreview,
  type HeadcountFileViewerFile,
} from './headcount-attachment-utils';

interface UseHeadcountAttachmentModalOptions {
  headcount: Headcount | null;
  onUpdate: () => void;
}

export function useHeadcountAttachmentModal({
  headcount,
  onUpdate,
}: UseHeadcountAttachmentModalOptions) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileViewerFile, setFileViewerFile] = useState<HeadcountFileViewerFile | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setSelectedFiles(Array.from(files));
  };

  const handleFilePreview = (file: File) => {
    setFileViewerFile(createSelectedHeadcountFilePreview(file));
    setFileViewerOpen(true);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleFileUpload = async () => {
    if (!selectedFiles.length || !headcount) return;

    setUploading(true);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('label', file.name);

        const response = await fetch(`/api/headcount/${headcount.id}/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await readJsonObject(response);
          throw new Error(getJsonErrorMessage(errorData, `Failed to upload file: ${response.status} ${response.statusText}`));
        }
      }

      toast.success('Files uploaded successfully');
      setSelectedFiles([]);
      onUpdate();
    } catch (error) {
      console.error('[UPLOAD] Error uploading files:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?') || !headcount) {
      return;
    }

    setDeleting(attachmentId);
    try {
      const response = await fetch(`/api/headcount/${headcount.id}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await readJsonObject(response);
        throw new Error(getJsonErrorMessage(errorData, 'Failed to delete attachment'));
      }

      toast.success('Attachment deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete attachment');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      if (!headcount) {
        toast.error('Headcount not available for download');
        return;
      }

      const response = await fetch(buildHeadcountAttachmentDownloadUrl(attachment, headcount.id));
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeUrl = sanitizeUrl(url);

      if (safeUrl) {
        link.href = safeUrl;
        link.download = attachment.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleAttachmentPreview = (attachment: Attachment) => {
    setFileViewerFile(createHeadcountAttachmentPreview(attachment, headcount?.id));
    setFileViewerOpen(true);
  };

  return {
    deleting,
    fileInputRef,
    fileViewerFile,
    fileViewerOpen,
    selectedFiles,
    setFileViewerOpen,
    uploading,
    handleAttachmentPreview,
    handleDeleteAttachment,
    handleDownload,
    handleFilePreview,
    handleFileSelect,
    handleFileUpload,
    handleRemoveFile,
  };
}
