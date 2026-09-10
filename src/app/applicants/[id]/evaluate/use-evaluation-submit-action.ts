"use client";

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-hot-toast';

import type { EvaluationFormData, EvaluationSummary, Interviewer, TestingResult } from './types';
import { readJsonOrFallback } from '../../../../lib/response-json';
import {
  buildEvaluationSavePayload,
  haveAllInterviewersCompleted,
} from './utils';

type EvaluationSavePayload = ReturnType<typeof buildEvaluationSavePayload>;
type EvaluationPostResponse = Pick<Response, 'ok' | 'json'>;

export type EvaluationPostFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<EvaluationPostResponse>;

interface UseEvaluationSubmitActionInput {
  applicantId: string;
  formData: EvaluationFormData | null;
  testingResults: TestingResult[];
  interviewers: Interviewer[];
  setSaving: Dispatch<SetStateAction<boolean>>;
  applySavedEvaluation: (savedEvaluation: EvaluationSummary) => Map<string, EvaluationSummary>;
  refreshExistingEvaluation: () => Promise<void>;
  setSuccessModalOpen: Dispatch<SetStateAction<boolean>>;
  navigateToResult: () => void;
}

export function getEvaluationPostErrorMessage(errorData: unknown, fallbackMessage: string) {
  if (!errorData || typeof errorData !== 'object') {
    return fallbackMessage;
  }

  const { message, error } = errorData as { message?: unknown; error?: unknown };
  return (
    (typeof message === 'string' && message.trim()) ||
    (typeof error === 'string' && error.trim()) ||
    fallbackMessage
  );
}

export async function postApplicantEvaluation(
  applicantId: string,
  payload: EvaluationSavePayload,
  fetcher: EvaluationPostFetcher = fetch,
  fallbackErrorMessage = 'Failed to submit evaluation'
) {
  const response = await fetcher(`/api/v1/applicants/${applicantId}/evaluation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return readJsonOrFallback<EvaluationSummary>(response, {});
  }

  const errorData = await readJsonOrFallback<unknown>(response, null);
  throw new Error(getEvaluationPostErrorMessage(errorData, fallbackErrorMessage));
}

export function useEvaluationSubmitAction({
  applicantId,
  formData,
  testingResults,
  interviewers,
  setSaving,
  applySavedEvaluation,
  refreshExistingEvaluation,
  setSuccessModalOpen,
  navigateToResult,
}: UseEvaluationSubmitActionInput) {
  return useCallback(async () => {
    if (!formData) return;

    try {
      setSaving(true);

      const savedEvaluation = await postApplicantEvaluation(
        applicantId,
        buildEvaluationSavePayload({
          applicantPositionId: formData.applicant.positionId,
          questions: formData.questions,
          testingResults,
          overallScore: formData.overallScore,
          comments: formData.comments,
          status: 'completed',
        })
      );
      const updatedMap = applySavedEvaluation(savedEvaluation);

      await refreshExistingEvaluation();

      if (haveAllInterviewersCompleted(interviewers, updatedMap)) {
        navigateToResult();
      } else {
        setSuccessModalOpen(true);
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error('Failed to submit evaluation');
    } finally {
      setSaving(false);
    }
  }, [
    applicantId,
    applySavedEvaluation,
    formData,
    interviewers,
    navigateToResult,
    refreshExistingEvaluation,
    setSaving,
    setSuccessModalOpen,
    testingResults,
  ]);
}
