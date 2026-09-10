import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { EvaluationAttachment, EvaluationAttachmentPreview } from './types';
import { readJsonOrFallback } from '../../../../lib/response-json';

function normalizeEvaluationAttachments(data: unknown): EvaluationAttachment[] {
  if (Array.isArray(data)) {
    return data as EvaluationAttachment[];
  }

  const wrappedData = (data as { data?: unknown } | null | undefined)?.data;
  return Array.isArray(wrappedData) ? wrappedData as EvaluationAttachment[] : [];
}

export function useEvaluationAttachments(applicantId: string) {
  const [attachments, setAttachments] = useState<EvaluationAttachment[]>([]);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EvaluationAttachmentPreview | null>(null);

  const reloadAttachments = useCallback(async () => {
    try {
      const response = await fetch(`/api/applicants/${applicantId}/resumes?limit=50&offset=0`, {
        credentials: 'include',
      });

      if (response.ok) {
        setAttachments(normalizeEvaluationAttachments(await readJsonOrFallback<unknown>(response, [])));
      }
    } catch (error) {
      console.error('Error reloading attachments:', error);
    }
  }, [applicantId]);

  const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/applicants/${applicantId}/resumes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachmentId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await readJsonOrFallback<{ message?: string; error?: string }>(response, {
          message: 'Failed to delete attachment',
        });
        throw new Error(errorData.message || errorData.error || 'Failed to delete attachment');
      }

      await reloadAttachments();
      toast.success('Attachment deleted successfully');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete attachment');
    }
  }, [applicantId, reloadAttachments]);

  const handleFileSelect = useCallback((file: EvaluationAttachmentPreview) => {
    setSelectedFile(file);
    setFileViewerOpen(true);
  }, []);

  const handleFileViewerOpenChange = useCallback((open: boolean) => {
    setFileViewerOpen(open);
    if (!open) {
      setSelectedFile(null);
    }
  }, []);

  return {
    attachments,
    fileViewerOpen,
    selectedFile,
    reloadAttachments,
    handleDeleteAttachment,
    handleFileSelect,
    handleFileViewerOpenChange,
  };
}
