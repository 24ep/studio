"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import FullApplicantDetail from './FullApplicantDetail';
import type { Applicant } from '@/lib/types';
import {
  loadApplicantDetailPreviewData,
  isApplicantDetailAbortError,
  type ApplicantAttachment,
} from './applicant-detail-view-api';
import type { ApplicantCommentItem } from './applicant-comments-utils';
import {
  ApplicantDetailErrorState,
  ApplicantDetailLoadingState,
  ApplicantDetailNotFoundState,
} from './ApplicantDetailViewParts';

interface ApplicantDetailViewProps {
  applicantId: string;
  onClose?: () => void;
  isModal?: boolean;
  onRefresh?: () => void;
}

const ApplicantDetailView: React.FC<ApplicantDetailViewProps> = ({ applicantId, onClose, isModal, onRefresh }) => {
  const [comments, setComments] = useState<ApplicantCommentItem[]>([]);
  const [attachments, setAttachments] = useState<ApplicantAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicantExists, setApplicantExists] = useState<boolean | null>(null);
  const [initialApplicant, setInitialApplicant] = useState<Applicant | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }

    if (!applicantId) {
      setIsLoading(false);
      setError('Invalid applicant ID');
      return;
    }

    isLoadingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && abortControllerRef.current) {
        console.warn('Loading timeout reached for applicant details:', applicantId);
        setIsLoading(false);
        setError('Loading timeout - please try again');
        abortControllerRef.current.abort();
      }
    }, 60000);

    try {
      const detailData = await loadApplicantDetailPreviewData(
        applicantId,
        abortControllerRef.current.signal
      );
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setComments(detailData.comments);
      setAttachments(detailData.attachments);
      setInitialApplicant(detailData.initialApplicant);
      setApplicantExists(detailData.applicantExists);
      setError(detailData.error);
    } catch (error) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (isApplicantDetailAbortError(error)) return;

      console.error(`ApplicantDetailView error loading applicant data for applicantId: ${applicantId}:`, error);
      setError('Failed to load applicant data. Please try again.');
      setApplicantExists(false);
    } finally {
      isLoadingRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [applicantId]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      isLoadingRef.current = false;
    };
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadData();
      if (onRefresh) onRefresh();
    }, 300);
  }, [loadData, onRefresh]);

  if (isLoading) {
    return <ApplicantDetailLoadingState />;
  }

  if (error) {
    return (
      <ApplicantDetailErrorState
        error={error}
        onRefresh={handleRefresh}
        onClose={onClose}
      />
    );
  }

  if (applicantExists === false) {
    return <ApplicantDetailNotFoundState onClose={onClose} />;
  }

  return (
    <FullApplicantDetail
      applicantId={applicantId}
      isModal={isModal}
      onClose={onClose}
      comments={comments}
      resumes={attachments}
      onRefresh={handleRefresh}
      initialApplicant={initialApplicant}
    />
  );
};

export default ApplicantDetailView;
