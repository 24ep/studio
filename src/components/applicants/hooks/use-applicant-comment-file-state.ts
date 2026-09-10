import { useCallback, useRef, useState } from 'react';

import {
  appendCommentFilesWithLabels,
  createCommentAttachmentPreview,
  type CommentAttachmentPreview,
} from '../applicant-comments-utils';

export function useApplicantCommentFileState(applicantId: string) {
  const [files, setFiles] = useState<File[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{
    fileName: string;
    url: string;
    label?: string;
    updatedAt?: string;
    fileSize?: number;
    filePath?: string;
    applicantId?: string;
  } | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setLabels([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileClick = useCallback((attachment: CommentAttachmentPreview) => {
    setSelectedFile(createCommentAttachmentPreview(attachment, applicantId));
    setIsFileViewerOpen(true);
  }, [applicantId]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
    setFiles(prev => appendCommentFilesWithLabels(Array.isArray(prev) ? prev : [], [], selectedFiles).files);
    setLabels(prev => appendCommentFilesWithLabels([], Array.isArray(prev) ? prev : [], selectedFiles).labels);
  }, []);

  const handleRemoveFile = useCallback((idx: number) => {
    setFiles(prev => Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : []);
    setLabels(prev => Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : []);
  }, []);

  const handleLabelChange = useCallback((idx: number, value: string) => {
    setLabels(prev => Array.isArray(prev) ? prev.map((label, i) => (i === idx ? value : label)) : []);
  }, []);

  return {
    clearFiles,
    fileInputRef,
    files,
    handleFileChange,
    handleFileClick,
    handleLabelChange,
    handleRemoveFile,
    isFileViewerOpen,
    labels,
    selectedFile,
    setIsFileViewerOpen,
  };
}
