"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, XCircle, Image as ImageIcon, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in bytes
  showPreview?: boolean;
  previewSize?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  allowUrl?: boolean;
  allowFile?: boolean;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPT = 'image/*';

export function ImageUpload({
  value,
  onChange,
  label = "Image",
  placeholder = "Enter image URL or upload file",
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  showPreview = true,
  previewSize = 'md',
  className = "",
  disabled = false,
  allowUrl = true,
  allowFile = true
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewSizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreviewUrl(url);
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Convert to data URL for preview and storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
        setPreviewUrl(dataUrl);
        setIsUploading(false);
        toast.success('Image uploaded successfully');
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      setIsUploading(false);
    }
  }, [maxSize, onChange]);

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
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const input = fileInputRef.current;
        if (input) {
          input.files = files;
          handleFileChange({ target: { files } } as React.ChangeEvent<HTMLInputElement>);
        }
      } else {
        toast.error('Please drop a valid image file');
      }
    }
  }, [handleFileChange]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label>{label}</Label>}
      
      {/* Input Mode Toggle */}
      {allowUrl && allowFile && (
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
      )}

      {/* URL Input */}
      {inputMode === 'url' && allowUrl && (
        <div className="space-y-2">
          <Input
            value={value || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="input-gradient"
          />
        </div>
      )}

      {/* File Upload */}
      {inputMode === 'file' && allowFile && (
        <div className="space-y-2">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 hover:border-primary/50 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !disabled && fileInputRef.current?.click()}
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
      )}

      {/* Preview */}
      {showPreview && previewUrl && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className={`${previewSizeClasses[previewSize]} object-cover rounded-lg border shadow-sm`}
              onError={() => {
                setPreviewUrl(null);
                toast.error('Failed to load image preview');
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
              disabled={disabled}
            >
              <XCircle className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Error Preview */}
      {showPreview && value && !previewUrl && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="relative inline-block">
            <div className={`${previewSizeClasses[previewSize]} bg-muted rounded-lg border flex items-center justify-center`}>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
              disabled={disabled}
            >
              <XCircle className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-destructive">Invalid image URL</p>
        </div>
      )}
    </div>
  );
} 