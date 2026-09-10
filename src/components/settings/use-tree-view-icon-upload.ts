"use client";

import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import { toast } from 'react-hot-toast';
import { getTreeIconFileValidationError, type TreeItemFormData } from './tree-view-utils';

interface UseTreeViewIconUploadOptions {
  setItemFormData: React.Dispatch<React.SetStateAction<TreeItemFormData>>;
}

export function useTreeViewIconUpload({ setItemFormData }: UseTreeViewIconUploadOptions) {
  const [mainIconFile, setMainIconFile] = useState<File | null>(null);
  const [mainIconPreview, setMainIconPreview] = useState<string | null>(null);

  const handleMainFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = getTreeIconFileValidationError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setMainIconFile(file);
    setMainIconPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return URL.createObjectURL(file);
    });
  }, []);

  const removeMainIcon = useCallback(() => {
    setMainIconPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return null;
    });
    setMainIconFile(null);
    setItemFormData((currentFormData) => ({ ...currentFormData, iconUrl: '' }));
  }, [setItemFormData]);

  const resetMainIcon = useCallback(() => {
    setMainIconPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return null;
    });
    setMainIconFile(null);
  }, []);

  useEffect(() => () => {
    if (mainIconPreview) {
      URL.revokeObjectURL(mainIconPreview);
    }
  }, [mainIconPreview]);

  return {
    handleMainFileUpload,
    mainIconFile,
    mainIconPreview,
    removeMainIcon,
    resetMainIcon,
  };
}
