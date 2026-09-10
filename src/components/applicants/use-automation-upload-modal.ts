"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  enqueueAutomationUpload,
  uploadAutomationResumeFile,
  validateAutomationUploadFile,
} from './automation-upload-api';

interface UseAutomationUploadModalInput {
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

export function useAutomationUploadModal({
  onOpenChange,
  onUploadSuccess,
}: UseAutomationUploadModalInput) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateAutomationUploadFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setSelectedPositionId('');
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetUploadState();
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const uploadResult = await uploadAutomationResumeFile(selectedFile);
      await enqueueAutomationUpload({
        file: selectedFile,
        targetPositionId: selectedPositionId,
        uploadResult,
      });

      toast.success('Resume sent for automated Applicant creation!');
      resetUploadState();
      onOpenChange(false);
      onUploadSuccess?.();
      window.dispatchEvent(new CustomEvent('refreshApplicantQueue'));
    } catch (error) {
      console.error('Automation upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Automation upload failed (unexpected error)');
    } finally {
      setUploading(false);
    }
  };

  return {
    dragActive,
    handleConfirmUpload,
    handleFiles,
    handleOpenChange,
    selectedFile,
    selectedPositionId,
    setDragActive,
    setSelectedFile,
    setSelectedPositionId,
    uploading,
  };
}
