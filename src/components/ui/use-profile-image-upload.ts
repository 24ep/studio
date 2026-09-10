import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';

import { readJsonOrFallback } from '../../lib/response-json';
import { getCacheBustedImageUrl, refreshImage } from '@/lib/imageUtils';
import {
  getUploadedImageUrl,
  hasProfileImage,
  type ProfileImageUploadUser,
  validateProfileImageFile,
} from './profile-image-upload-utils';

interface UseProfileImageUploadOptions {
  onImageRemove: () => Promise<void>;
  onImageUpload: (imageUrl: string) => Promise<void>;
  user: ProfileImageUploadUser;
}

export function useProfileImageUpload({
  onImageRemove,
  onImageUpload,
  user,
}: UseProfileImageUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const imageUrl = getUploadedImageUrl(await readJsonOrFallback<unknown>(response, {}));
      if (!imageUrl) {
        throw new Error('Upload response did not include an image URL');
      }

      await onImageUpload(imageUrl);
      await refreshImage(imageUrl);

      toast.success('Profile image updated successfully');
      clearPreview();
      setForceRefresh(true);
      resetFileInput();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.');
      clearPreview();
    } finally {
      setIsUploading(false);
    }
  }, [clearPreview, onImageUpload, resetFileInput]);

  const handleFileSelect = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateProfileImageFile(file);
    if (!validation.ok) {
      toast.error(validation.message || 'Please select a valid image file');
      resetFileInput();
      return;
    }

    clearPreview();
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);

    await handleUpload(file);
  }, [clearPreview, handleUpload, resetFileInput]);

  const handleRemove = useCallback(async () => {
    setIsRemoving(true);
    try {
      if (user.avatarUrl) {
        void refreshImage(user.avatarUrl);
      }

      await onImageRemove();
      toast.success('Profile image removed successfully');
      clearPreview();
      setForceRefresh(true);
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove image. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  }, [clearPreview, onImageRemove, user.avatarUrl]);

  const displayImageUrl = previewUrl || getCacheBustedImageUrl(user, forceRefresh);

  return {
    displayImageUrl,
    fileInputRef,
    forceRefresh,
    handleFileSelect,
    handleRemove,
    hasImage: hasProfileImage({ displayImageUrl, user }),
    isRemoving,
    isUploading,
  };
}
