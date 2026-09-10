import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { readJsonOrFallback } from '../../lib/response-json';
import { addCacheBuster, getCacheBustedImageUrl, refreshImage } from '@/lib/imageUtils';
import { getUploadedImageUrl } from './profile-image-upload-utils';
import type { UserAvatarUploadUser } from './user-avatar-upload-utils';

interface UseUserAvatarUploadOptions {
  onFileUpload?: (file: File) => Promise<string | null | void>;
  onImageRemove?: () => Promise<void>;
  onImageUpload: (imageUrl: string) => Promise<void>;
  user: UserAvatarUploadUser;
}

export function useUserAvatarUpload({
  onFileUpload,
  onImageRemove,
  onImageUpload,
  user,
}: UseUserAvatarUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
    };
  }, []);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const clearPreview = useCallback(() => {
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const handleFileSelect = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setAvatarError(null);

    try {
      if (onFileUpload) {
        const uploadedUrl = await onFileUpload(file);
        if (uploadedUrl) setPreviewUrl(addCacheBuster(uploadedUrl, true));
        setForceRefresh(true);
        resetFileInput();
        return;
      }

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
      setPreviewUrl(addCacheBuster(imageUrl, true));
      setForceRefresh(true);
      resetFileInput();
    } catch (error) {
      console.error('Upload error:', error);
      setAvatarError('Failed to upload image. Please try again.');
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload, onImageUpload, resetFileInput]);

  const handleRemove = useCallback(async () => {
    if (!onImageRemove) return;
    setIsRemoving(true);
    setAvatarError(null);

    try {
      if (user.avatarUrl) {
        void refreshImage(user.avatarUrl);
      }

      await onImageRemove();
      toast.success('Profile image removed successfully');
      setForceRefresh(true);
      clearPreview();
    } catch (error) {
      console.error('Remove error:', error);
      setAvatarError('Failed to remove image. Please try again.');
      toast.error('Failed to remove image. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  }, [clearPreview, onImageRemove, user.avatarUrl]);

  return {
    avatarError,
    displayImageUrl: previewUrl || getCacheBustedImageUrl(user, forceRefresh),
    fileInputRef,
    handleFileSelect,
    handleRemove,
    isRemoving,
    isUploading,
  };
}
