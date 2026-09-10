"use client";

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { Applicant } from '@/lib/types';
import { uploadEvaluateReportAvatar } from './evaluate-report-section-api';

export function useEvaluateReportAvatarUpload({
    applicant,
    canEditApplicantBasic,
    setApplicant,
}: {
    applicant: Applicant | null;
    canEditApplicantBasic: () => boolean;
    setApplicant: Dispatch<SetStateAction<Applicant | null>>;
}) {
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = useCallback(async (file: File) => {
        if (!applicant || !canEditApplicantBasic()) return;

        setAvatarUploading(true);
        try {
            const avatarUrl = await uploadEvaluateReportAvatar(applicant.id, file);
            setApplicant(prev => prev ? { ...prev, avatarUrl } : null);
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
        handleAvatarUpload,
    };
}
