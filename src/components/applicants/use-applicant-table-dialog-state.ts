"use client";

import { useCallback, useState } from 'react';
import type { Applicant } from '@/lib/types';
import type { ApplicantTableProps } from './ApplicantTableTypes';

interface UseApplicantTableDialogStateOptions {
  onDeleteApplicant: ApplicantTableProps['onDeleteApplicant'];
}

export function useApplicantTableDialogState({
  onDeleteApplicant,
}: UseApplicantTableDialogStateOptions) {
  const [applicantToDelete, setApplicantToDelete] = useState<Applicant | null>(null);
  const confirmDelete = useCallback((applicant: Applicant) => {
    setApplicantToDelete(applicant);
  }, []);

  const cancelDelete = useCallback(() => {
    setApplicantToDelete(null);
  }, []);

  const executeDelete = useCallback(() => {
    if (!applicantToDelete) return;

    void onDeleteApplicant(applicantToDelete.id);
    setApplicantToDelete(null);
  }, [applicantToDelete, onDeleteApplicant]);

  return {
    applicantToDelete,
    cancelDelete,
    confirmDelete,
    executeDelete,
  };
}
