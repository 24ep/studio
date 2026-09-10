"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { Applicant, Position } from '@/lib/types';
import { sanitizeUrl } from '@/lib/utils';
import {
  type ApplicantEvaluationData,
  type ApplicantEvaluationAttachment,
  type AveragedApplicantEvaluationData,
  fetchApplicantEvaluationAttachments,
  fetchApplicantEvaluationPositionValidation,
  fetchApplicantEvaluationSummary,
} from './applicant-evaluation-modal-api';
import type {
  ApplicantEvaluationPositionValidation as PositionValidationState,
} from './applicant-evaluation-modal-utils';
import { useApplicantEvaluationLinkState } from './use-applicant-evaluation-link-state';

interface UseApplicantEvaluationModalStateInput {
  isOpen: boolean;
  applicant: Applicant;
  position?: Position;
  canViewLinks: boolean;
}

export interface ApplicantEvaluationSelectedFile {
  fileName: string;
  url: string;
  filePath?: string;
  applicantId?: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number | string;
}

const emptyPositionValidation: PositionValidationState = {
  hasInterviewers: false,
  hasSkills: false,
  isLoading: false,
  error: null,
};

export function useApplicantEvaluationModalState({
  isOpen,
  applicant,
  position,
  canViewLinks,
}: UseApplicantEvaluationModalStateInput) {
  const [evaluationData, setEvaluationData] = useState<ApplicantEvaluationData | null>(null);
  const [averagedEvaluationData, setAveragedEvaluationData] = useState<AveragedApplicantEvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<ApplicantEvaluationAttachment[]>([]);
  const [positionValidation, setPositionValidation] = useState<PositionValidationState>(emptyPositionValidation);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ApplicantEvaluationSelectedFile | null>(null);
  const linkState = useApplicantEvaluationLinkState({
    applicantId: applicant?.id,
    canViewLinks,
  });
  const {
    createOrGetLink,
    expireDays,
    fetchEvaluationLink,
    linkInfo,
    linkLoading,
    removeLink,
    requireLogin,
    setExpireDays,
    setRequireLogin,
    setShowCreateLinkModal,
    setShowLinkModal,
    showCreateLinkModal,
    showLinkModal,
  } = linkState;

  const validatePosition = useCallback(async () => {
    const positionId = applicant?.positionId || position?.id;
    if (!positionId) {
      setPositionValidation({
        ...emptyPositionValidation,
        error: 'Applicant has no assigned position',
      });
      return;
    }

    setPositionValidation(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const validation = await fetchApplicantEvaluationPositionValidation(positionId);
      setPositionValidation({
        hasInterviewers: validation.hasInterviewers,
        hasSkills: validation.hasSkills,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error validating position:', err);
      setPositionValidation({
        ...emptyPositionValidation,
        error: 'Failed to validate position configuration',
      });
    }
  }, [applicant?.positionId, position?.id]);

  const fetchEvaluationData = useCallback(async () => {
    if (!applicant?.id) return;

    try {
      setLoading(true);
      const summary = await fetchApplicantEvaluationSummary(applicant.id);
      setEvaluationData(summary.evaluationData);
      setAveragedEvaluationData(summary.averagedEvaluationData);
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
      toast.error('Failed to load evaluation data');
      setEvaluationData(null);
      setAveragedEvaluationData(null);
    } finally {
      setLoading(false);
    }
  }, [applicant?.id]);

  const fetchAttachments = useCallback(async () => {
    if (!applicant?.id) return;

    try {
      setAttachments(await fetchApplicantEvaluationAttachments(applicant.id));
    } catch {
      // Assets are optional for this modal.
    }
  }, [applicant?.id]);

  useEffect(() => {
    if (!isOpen || !applicant?.id) {
      return;
    }

    fetchEvaluationData();
    fetchAttachments();
    fetchEvaluationLink();
    validatePosition();
  }, [
    isOpen,
    applicant?.id,
    fetchAttachments,
    fetchEvaluationData,
    fetchEvaluationLink,
    validatePosition,
  ]);

  const handleStartEvaluation = useCallback(() => {
    if (linkInfo?.url) {
      const safeUrl = sanitizeUrl(linkInfo.url);
      if (safeUrl) {
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Invalid evaluation link');
      }
      return;
    }

    window.open(`/applicants/${applicant.id}/evaluate`, '_blank', 'noopener,noreferrer');
  }, [applicant.id, linkInfo?.url]);

  return {
    attachments,
    averagedEvaluationData,
    createOrGetLink,
    evaluationData,
    expireDays,
    fetchEvaluationLink,
    fileViewerOpen,
    handleStartEvaluation,
    linkInfo,
    linkLoading,
    loading,
    positionValidation,
    removeLink,
    requireLogin,
    selectedFile,
    setExpireDays,
    setFileViewerOpen,
    setRequireLogin,
    setSelectedFile,
    setShowCreateLinkModal,
    setShowLinkModal,
    showCreateLinkModal,
    showLinkModal,
  };
}
