import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Applicant } from '@/lib/types';
import { getJsonErrorMessage, getJsonString, readJsonObject } from '@/lib/response-json';

interface UseApplicantAvatarUploadInput {
  applicant: Applicant | null;
  setApplicant: Dispatch<SetStateAction<Applicant | null>>;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
}

export function useApplicantAvatarUpload({
  applicant,
  setApplicant,
  toastSuccess,
  toastError,
}: UseApplicantAvatarUploadInput) {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarForceRefresh, setAvatarForceRefresh] = useState(false);
  const avatarForceRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (avatarForceRefreshTimeoutRef.current) {
        clearTimeout(avatarForceRefreshTimeoutRef.current);
      }
    };
  }, []);

  const handleAvatarUpload = async (file: File) => {
    if (!applicant) {
      setAvatarError('No applicant available for avatar upload');
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`/api/applicants/${applicant.id}/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await readJsonObject(response);
        throw new Error(getJsonErrorMessage(errorData, 'Failed to update avatar'));
      }

      const result = await readJsonObject(response);
      setApplicant(prev => prev ? { ...prev, avatarUrl: getJsonString(result, 'avatarUrl') ?? null } : null);

      setAvatarForceRefresh(true);
      if (avatarForceRefreshTimeoutRef.current) {
        clearTimeout(avatarForceRefreshTimeoutRef.current);
      }
      avatarForceRefreshTimeoutRef.current = setTimeout(() => setAvatarForceRefresh(false), 1000);

      toastSuccess('Avatar updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update avatar';
      console.error('[useApplicantAvatarUpload] Error:', error);
      setAvatarError(errorMessage);
      toastError(errorMessage);
    } finally {
      setAvatarUploading(false);
    }
  };

  return {
    avatarUploading,
    avatarError,
    avatarForceRefresh,
    handleAvatarUpload,
  };
}
