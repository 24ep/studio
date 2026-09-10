"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Image as ImageIcon, Loader2, UploadCloud, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getImageUploadPreviewSizeClass,
  type ImageUploadPreviewSize,
} from './image-upload-utils';

interface ImageUploadModeToggleProps {
  disabled: boolean;
  inputMode: 'url' | 'file';
  setInputMode: (mode: 'url' | 'file') => void;
}

export function ImageUploadModeToggle({
  disabled,
  inputMode,
  setInputMode,
}: ImageUploadModeToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={inputMode === 'url' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setInputMode('url')}
        disabled={disabled}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        URL
      </Button>
      <Button
        type="button"
        variant={inputMode === 'file' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setInputMode('file')}
        disabled={disabled}
      >
        <UploadCloud className="h-4 w-4 mr-2" />
        Upload
      </Button>
    </div>
  );
}

interface ImageUploadUrlInputProps {
  disabled: boolean;
  handleUrlChange: (url: string) => void;
  placeholder: string;
  value?: string;
}

export function ImageUploadUrlInput({
  disabled,
  handleUrlChange,
  placeholder,
  value,
}: ImageUploadUrlInputProps) {
  return (
    <div className="space-y-2">
      <Input
        value={value || ''}
        onChange={(e) => handleUrlChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input-gradient"
      />
    </div>
  );
}

interface ImageUploadDropZoneProps {
  accept: string;
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  maxSize: number;
}

export function ImageUploadDropZone({
  accept,
  disabled,
  fileInputRef,
  handleDrop,
  handleFileChange,
  isUploading,
  maxSize,
}: ImageUploadDropZoneProps) {
  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 hover:border-primary/50 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        onClick={() => !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Drop image here or click to select</p>
            <p className="text-xs text-muted-foreground mt-1">
              Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ImageUploadPreviewProps {
  disabled: boolean;
  handleRemove: () => void;
  previewSize: ImageUploadPreviewSize;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  value?: string;
}

export function ImageUploadPreview({
  disabled,
  handleRemove,
  previewSize,
  previewUrl,
  setPreviewUrl,
  value,
}: ImageUploadPreviewProps) {
  const previewSizeClass = getImageUploadPreviewSizeClass(previewSize);

  if (previewUrl) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preview</Label>
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className={`${previewSizeClass} object-cover rounded-xl border shadow-sm`}
            onError={() => {
              setPreviewUrl(null);
              toast.error('Failed to load image preview');
            }}
          />
          <ImageUploadRemoveButton disabled={disabled} handleRemove={handleRemove} />
        </div>
      </div>
    );
  }

  if (!value) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Preview</Label>
      <div className="relative inline-block">
        <div className={`${previewSizeClass} bg-muted rounded-xl border flex items-center justify-center`}>
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <ImageUploadRemoveButton disabled={disabled} handleRemove={handleRemove} />
      </div>
      <p className="text-xs text-destructive">Invalid image URL</p>
    </div>
  );
}

function ImageUploadRemoveButton({
  disabled,
  handleRemove,
}: {
  disabled: boolean;
  handleRemove: () => void;
}) {
  return (
    <Button
      type="button"
      variant="destructive"
      size="icon"
      aria-label="Remove image"
      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
      onClick={handleRemove}
      disabled={disabled}
    >
      <XCircle className="h-3 w-3" />
    </Button>
  );
}
