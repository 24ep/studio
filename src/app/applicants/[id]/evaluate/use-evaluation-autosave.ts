"use client";

import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import type { EvaluationFormData, EvaluationQuestion, EvaluationSummary, TestingResult } from './types';
import {
  buildEvaluationSavePayload,
  buildPersonalityScoresForSave,
} from './utils';
import { saveEvaluationAutosave } from './evaluation-autosave-api';

type SavedEvaluationHandler = (savedEvaluation: EvaluationSummary) => unknown | Promise<unknown>;

interface UseEvaluationPersonalityAutosaveInput {
  applicantId: string;
  formData: EvaluationFormData | null;
  testingResults: TestingResult[];
  selectedInterviewerId: string | null;
  setSaving: Dispatch<SetStateAction<boolean>>;
  onSavedEvaluation: SavedEvaluationHandler;
}

interface UseEvaluationTestingResultsAutosaveInput {
  applicantId: string;
  formData: EvaluationFormData | null;
  selectedInterviewerId: string | null;
  testingResultsRef: MutableRefObject<TestingResult[]>;
  onSavedEvaluation: SavedEvaluationHandler;
}

type PersonalityScorePayload = Array<{ traitId: string; score: number; notes: string }>;
type AutosaveTimeoutRef = MutableRefObject<ReturnType<typeof setTimeout> | null>;

function clearAutosaveTimeout(timeoutRef: AutosaveTimeoutRef) {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

function useClearAutosaveTimeoutOnUnmount(timeoutRef: AutosaveTimeoutRef) {
  useEffect(() => {
    return () => {
      clearAutosaveTimeout(timeoutRef);
    };
  }, [timeoutRef]);
}

export function useEvaluationPersonalityAutosave({
  applicantId,
  formData,
  testingResults,
  selectedInterviewerId,
  setSaving,
  onSavedEvaluation,
}: UseEvaluationPersonalityAutosaveInput) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({
    applicantId,
    formData,
    testingResults,
    selectedInterviewerId,
    onSavedEvaluation,
  });

  useEffect(() => {
    latestRef.current = {
      applicantId,
      formData,
      testingResults,
      selectedInterviewerId,
      onSavedEvaluation,
    };
  }, [applicantId, formData, testingResults, selectedInterviewerId, onSavedEvaluation]);

  const saveInternal = useCallback(async (
    validPersonalityScores: PersonalityScorePayload,
    overallScore: number,
    comments: string
  ) => {
    const current = latestRef.current;
    if (!current.formData) return;

    if (!current.selectedInterviewerId) {
      console.warn('Cannot save evaluation: No interviewer selected');
      return;
    }

    try {
      setSaving(true);

      await saveEvaluationAutosave({
        applicantId: current.applicantId,
        failureMessage: 'Failed to update personality traits',
        logLabel: 'Error auto-saving evaluation:',
        onSavedEvaluation: current.onSavedEvaluation,
        successMessage: 'Evaluation updated',
        payload: {
          ...buildEvaluationSavePayload({
            applicantPositionId: current.formData.applicant.positionId,
            evaluatorId: current.selectedInterviewerId,
            questions: current.formData.questions,
            testingResults: current.testingResults,
            overallScore,
            comments,
            status: 'completed',
          }),
          personalityScores: validPersonalityScores,
        },
      });
    } catch (error) {
      console.error('Error auto-saving evaluation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update personality traits';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [setSaving]);

  const triggerAutoSave = useCallback((
    questions?: EvaluationQuestion[],
    overallScore?: number,
    comments?: string
  ) => {
    clearAutosaveTimeout(timeoutRef);

    timeoutRef.current = setTimeout(() => {
      const current = latestRef.current;
      if (!current.formData) return;

      const questionsToSave = questions || current.formData.questions;
      const scoreToSave = overallScore !== undefined ? overallScore : current.formData.overallScore;
      const commentsToSave = comments !== undefined ? comments : current.formData.comments;
      const validPersonalityScores = buildPersonalityScoresForSave(questionsToSave);

      if (validPersonalityScores.length > 0) {
        saveInternal(validPersonalityScores, scoreToSave, commentsToSave);
      }
    }, 1000);
  }, [saveInternal]);

  useClearAutosaveTimeoutOnUnmount(timeoutRef);

  return { triggerAutoSave };
}

export function useEvaluationTestingResultsAutosave({
  applicantId,
  formData,
  selectedInterviewerId,
  testingResultsRef,
  onSavedEvaluation,
}: UseEvaluationTestingResultsAutosaveInput) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({
    applicantId,
    formData,
    selectedInterviewerId,
    onSavedEvaluation,
  });

  useEffect(() => {
    latestRef.current = {
      applicantId,
      formData,
      selectedInterviewerId,
      onSavedEvaluation,
    };
  }, [applicantId, formData, selectedInterviewerId, onSavedEvaluation]);

  const triggerTestingResultsAutoSave = useCallback(() => {
    clearAutosaveTimeout(timeoutRef);

    timeoutRef.current = setTimeout(async () => {
      const currentTestingResults = testingResultsRef.current;
      const current = latestRef.current;
      if (!current.formData || !current.selectedInterviewerId || currentTestingResults.length === 0) return;

      try {
        const payload = buildEvaluationSavePayload({
          applicantPositionId: current.formData.applicant.positionId,
          evaluatorId: current.selectedInterviewerId,
          questions: current.formData.questions,
          testingResults: currentTestingResults,
          overallScore: current.formData.overallScore,
          comments: current.formData.comments,
          status: 'in_progress',
        });

        const expertiseScores = payload.expertiseScores || [];
        if (expertiseScores.length === 0) return;

        await saveEvaluationAutosave({
          applicantId: current.applicantId,
          failureMessage: 'Failed to update testing results',
          logLabel: 'Error auto-saving testing results:',
          onSavedEvaluation: current.onSavedEvaluation,
          payload,
          showErrorToast: false,
          successMessage: 'Testing results updated',
        });
      } catch (error) {
        console.error('Error auto-saving testing results:', error);
      }
    }, 1000);
  }, [testingResultsRef]);

  useClearAutosaveTimeoutOnUnmount(timeoutRef);

  return { triggerTestingResultsAutoSave };
}
