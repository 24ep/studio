"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApplicantTableProps } from './ApplicantTableTypes';

interface UseApplicantTableAssignmentStateOptions {
  canAssignSource: boolean;
  onAssignRecruiter: ApplicantTableProps['onAssignRecruiter'];
  onAssignSource: ApplicantTableProps['onAssignSource'];
}

export function useApplicantTableAssignmentState({
  canAssignSource,
  onAssignRecruiter,
  onAssignSource,
}: UseApplicantTableAssignmentStateOptions) {
  const [assigningRecruiter, setAssigningRecruiter] = useState<string | null>(null);
  const [assigningSource, setAssigningSource] = useState<string | null>(null);
  const assigningRecruiterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const assigningSourceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetAssigningRecruiterAfterDelay = useCallback(() => {
    const timeoutId = setTimeout(() => {
      setAssigningRecruiter(null);
    }, 1000);

    if (assigningRecruiterTimeoutRef.current) {
      clearTimeout(assigningRecruiterTimeoutRef.current);
    }
    assigningRecruiterTimeoutRef.current = timeoutId;
  }, []);

  const resetAssigningSourceAfterDelay = useCallback(() => {
    const timeoutId = setTimeout(() => {
      setAssigningSource(null);
    }, 1000);

    if (assigningSourceTimeoutRef.current) {
      clearTimeout(assigningSourceTimeoutRef.current);
    }
    assigningSourceTimeoutRef.current = timeoutId;
  }, []);

  const handleAssignRecruiter = useCallback(async (applicantId: string, recruiterId: string | null) => {
    setAssigningRecruiter(applicantId);
    try {
      onAssignRecruiter(applicantId, recruiterId);
    } finally {
      resetAssigningRecruiterAfterDelay();
    }
  }, [onAssignRecruiter, resetAssigningRecruiterAfterDelay]);

  const handleAssignSource = useCallback(async (applicantId: string, sourceId: string | null, subSource?: string | null) => {
    if (!canAssignSource || !onAssignSource) return;

    setAssigningSource(applicantId);
    try {
      await onAssignSource(applicantId, sourceId, subSource);
    } finally {
      resetAssigningSourceAfterDelay();
    }
  }, [canAssignSource, onAssignSource, resetAssigningSourceAfterDelay]);

  const handleResetAssigning = useCallback(() => {
    setAssigningRecruiter(null);
    setAssigningSource(null);
  }, []);

  useEffect(() => () => {
    if (assigningRecruiterTimeoutRef.current) {
      clearTimeout(assigningRecruiterTimeoutRef.current);
    }
    if (assigningSourceTimeoutRef.current) {
      clearTimeout(assigningSourceTimeoutRef.current);
    }
  }, []);

  return {
    assigningRecruiter,
    assigningSource,
    handleAssignRecruiter,
    handleAssignSource,
    handleResetAssigning,
  };
}
