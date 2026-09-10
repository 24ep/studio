import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Applicant } from '@/lib/types';
import { readJsonOrFallback } from '@/lib/response-json';

interface UseApplicantDetailAssignmentActionsInput {
  applicantId: string;
  setApplicant: Dispatch<SetStateAction<Applicant | null>>;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
}

export function useApplicantDetailAssignmentActions({
  applicantId,
  setApplicant,
  toastSuccess,
  toastError,
}: UseApplicantDetailAssignmentActionsInput) {
  const [isAssigningRecruiter, setIsAssigningRecruiter] = useState(false);
  const [isAssigningSource, setIsAssigningSource] = useState(false);

  const handleAssignRecruiter = useCallback(async (newRecruiterId: string | null) => {
    setIsAssigningRecruiter(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`/api/applicants/${applicantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterId: newRecruiterId }),
        credentials: 'include',
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await readJsonOrFallback<{ message?: string }>(response, { message: 'Failed to assign recruiter' });
        throw new Error(errorData.message || `Failed to assign recruiter: ${response.status}`);
      }

      const updatedApplicant = await readJsonOrFallback<Applicant | null>(response, null);
      if (updatedApplicant) {
        setApplicant(updatedApplicant);
      }
      toastSuccess(newRecruiterId ? 'Recruiter assigned successfully' : 'Recruiter unassigned successfully');
    } catch (error: unknown) {
      console.error('Error assigning recruiter:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toastError('Request timed out. Please try again.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to assign recruiter';
        toastError(errorMessage);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsAssigningRecruiter(false);
    }
  }, [applicantId, setApplicant, toastError, toastSuccess]);

  const handleAssignSource = useCallback(async (
    targetApplicantId: string,
    newSourceId: string | null,
    subSource?: string | null
  ) => {
    setIsAssigningSource(true);
    try {
      const response = await fetch(`/api/applicants/${targetApplicantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: newSourceId,
          subSource: subSource || null,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to assign source');
      }

      const updatedApplicant = await readJsonOrFallback<Applicant | null>(response, null);
      if (updatedApplicant) {
        setApplicant(updatedApplicant);
      }
      toastSuccess(newSourceId ? 'Source assigned successfully' : 'Source unassigned successfully');
    } catch (error: unknown) {
      console.error('Error assigning source:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign source';
      toastError(errorMessage);
    } finally {
      setIsAssigningSource(false);
    }
  }, [setApplicant, toastError, toastSuccess]);

  return {
    isAssigningRecruiter,
    isAssigningSource,
    setIsAssigningRecruiter,
    setIsAssigningSource,
    handleAssignRecruiter,
    handleAssignSource,
  };
}
