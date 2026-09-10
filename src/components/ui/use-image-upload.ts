"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getJsonString, readJsonObject } from '../../lib/response-json';
import { validateImageUploadFile } from './image-upload-utils';

interface UseImageUploadOptions {
  initialInputMode?: 'url' | 'file';
  maxSize: number;
  onChange: (value: string) => void;
  uploadMethod?: 'POST' | 'PUT';
  uploadUrl?: string;
  value?: string;
}

export function useImageUpload({
  initialInputMode = 'url',
  maxSize,
  onChange,
  uploadMethod = 'PUT',
  uploadUrl = '/api/settings/upload-image',
  value,
}: UseImageUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [inputMode, setInputMode] = useState<'url' | 'file'>(initialInputMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreviewUrl(url);
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageUploadFile(file, maxSize);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = typeof e.target?.result === 'string' ? e.target.result : null;
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(uploadUrl, {
        method: uploadMethod,
        body: formData,
      });

      if (!res.ok) {
        toast.error('Failed to upload image');
        return;
      }

      const url = getJsonString(await readJsonObject(res), 'url');
      if (!url) {
        toast.error('Upload response did not include an image URL');
        return;
      }

      onChange(url);
      setPreviewUrl(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  }, [maxSize, onChange, uploadMethod, uploadUrl]);

  const handleRemove = () => {
    onChange('');
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    const file = files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please drop a valid image file');
      return;
    }

    const input = fileInputRef.current;
    if (input) {
      input.files = files;
      handleFileChange({ target: { files } } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [handleFileChange]);

  return {
    fileInputRef,
    handleDrop,
    handleFileChange,
    handleRemove,
    handleUrlChange,
    inputMode,
    isUploading,
    previewUrl,
    setInputMode,
    setPreviewUrl,
  };
}
