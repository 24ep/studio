"use client";

import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { Applicant } from '@/lib/types';
import { getJsonErrorMessage, getJsonString, readJsonObject } from '@/lib/response-json';

import { canEditEvaluateResultApplicantBasic } from './utils';

type ReportPermissionUser = Parameters<typeof canEditEvaluateResultApplicantBasic>[0];

export function useEvaluateResultAvatarUpload({
  applicant,
  setApplicant,
  user,
}: {
  applicant: Applicant | null;
  setApplicant: (updater: (applicant: Applicant | null) => Applicant | null) => void;
  user: ReportPermissionUser;
}) {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const canEditApplicantBasic = useCallback(
    () => canEditEvaluateResultApplicantBasic(user),
    [user]
  );

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!applicant || !canEditApplicantBasic()) return;

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch(`/api/applicants/${applicant.id}/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await readJsonObject(res);
        throw new Error(getJsonErrorMessage(errorData, 'Failed to update avatar'));
      }

      const result = await readJsonObject(res);
      const avatarUrl = getJsonString(result, 'avatarUrl') ?? null;
      setApplicant((currentApplicant) => (
        currentApplicant ? { ...currentApplicant, avatarUrl } : null
      ));
      toast.success('Avatar updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update avatar';
      toast.error(errorMessage);
    } finally {
      setAvatarUploading(false);
    }
  }, [applicant, canEditApplicantBasic, setApplicant]);

  return {
    avatarInputRef,
    avatarUploading,
    canEditApplicantBasic,
    handleAvatarUpload,
  };
}
