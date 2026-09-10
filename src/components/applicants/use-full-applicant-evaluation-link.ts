"use client";

import { useCallback } from 'react';
import type { Applicant } from '@/lib/types';
import { getJsonString, readJsonObject } from '@/lib/response-json';

interface EvaluationQrData {
  name: string;
  url: string;
  avatarUrl: string | null;
  expiresAt?: string;
}

interface UseFullApplicantEvaluationLinkOptions {
  applicant: Applicant | null;
  canOpenEvalActions: boolean;
  canViewEvalLinks: boolean;
  onCreateEvalLinkOpen: () => void;
  onQrDataChange: (data: EvaluationQrData) => void;
  onQrModalOpen: () => void;
  onPermissionDenied: (message: string) => void;
}

export function useFullApplicantEvaluationLink({
  applicant,
  canOpenEvalActions,
  canViewEvalLinks,
  onCreateEvalLinkOpen,
  onQrDataChange,
  onQrModalOpen,
  onPermissionDenied,
}: UseFullApplicantEvaluationLinkOptions) {
  return useCallback(async () => {
    if (!canOpenEvalActions) {
      onPermissionDenied('You do not have permission to manage interview sessions.');
      return;
    }

    if (!canViewEvalLinks) {
      onCreateEvalLinkOpen();
      return;
    }

    if (!applicant?.id) return;

    try {
      const response = await fetch(`/api/v1/applicants/${applicant.id}/evaluation-link`, {
        credentials: 'include',
      });

      if (!response.ok) {
        onCreateEvalLinkOpen();
        return;
      }

      const data = await readJsonObject(response);
      const url = getJsonString(data, 'url');
      if (url) {
        onQrDataChange({
          name: applicant.name,
          url,
          avatarUrl: applicant.avatarUrl || null,
          expiresAt: getJsonString(data, 'expiresAt'),
        });
        onQrModalOpen();
      } else {
        onCreateEvalLinkOpen();
      }
    } catch (error) {
      console.error('Error checking for existing link:', error);
      onCreateEvalLinkOpen();
    }
  }, [
    applicant,
    canOpenEvalActions,
    canViewEvalLinks,
    onCreateEvalLinkOpen,
    onPermissionDenied,
    onQrDataChange,
    onQrModalOpen,
  ]);
}
