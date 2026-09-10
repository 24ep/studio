"use client";

import { Label } from '@/components/ui/label';
import {
  ImageUploadDropZone,
  ImageUploadModeToggle,
  ImageUploadPreview,
  ImageUploadUrlInput,
} from './image-upload-parts';
import {
  DEFAULT_IMAGE_UPLOAD_ACCEPT,
  DEFAULT_IMAGE_UPLOAD_MAX_SIZE,
  type ImageUploadPreviewSize,
} from './image-upload-utils';
import { useImageUpload } from './use-image-upload';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  accept?: string;
  maxSize?: number;
  showPreview?: boolean;
  previewSize?: ImageUploadPreviewSize;
  className?: string;
  disabled?: boolean;
  allowUrl?: boolean;
  allowFile?: boolean;
  uploadMethod?: 'POST' | 'PUT';
  uploadUrl?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Image",
  placeholder = "Enter image URL or upload file",
  accept = DEFAULT_IMAGE_UPLOAD_ACCEPT,
  maxSize = DEFAULT_IMAGE_UPLOAD_MAX_SIZE,
  showPreview = true,
  previewSize = 'md',
  className = "",
  disabled = false,
  allowUrl = true,
  allowFile = true,
  uploadMethod = 'PUT',
  uploadUrl = '/api/settings/upload-image',
}: ImageUploadProps) {
  const upload = useImageUpload({
    initialInputMode: allowUrl ? 'url' : 'file',
    maxSize,
    onChange,
    uploadMethod,
    uploadUrl,
    value,
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label>{label}</Label>}

      {allowUrl && allowFile && (
        <ImageUploadModeToggle
          disabled={disabled}
          inputMode={upload.inputMode}
          setInputMode={upload.setInputMode}
        />
      )}

      {allowUrl && upload.inputMode === 'url' && (
        <ImageUploadUrlInput
          disabled={disabled}
          handleUrlChange={upload.handleUrlChange}
          placeholder={placeholder}
          value={value}
        />
      )}

      {allowFile && (!allowUrl || upload.inputMode === 'file') && (
        <ImageUploadDropZone
          accept={accept}
          disabled={disabled}
          fileInputRef={upload.fileInputRef}
          handleDrop={upload.handleDrop}
          handleFileChange={upload.handleFileChange}
          isUploading={upload.isUploading}
          maxSize={maxSize}
        />
      )}

      {showPreview && (
        <ImageUploadPreview
          disabled={disabled}
          handleRemove={upload.handleRemove}
          previewSize={previewSize}
          previewUrl={upload.previewUrl}
          setPreviewUrl={upload.setPreviewUrl}
          value={value}
        />
      )}
    </div>
  );
}
