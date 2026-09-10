"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

import type { EvaluationApplicantLike, EvaluationFormData, EvaluationSummary, TestingResult } from './types';
import {
  applyEvaluationExpertiseScoresToTestingResults,
  applySelectedInterviewerEvaluationToFormData,
  buildExistingEvaluationRefreshState,
  getSharedInterviewRemarks,
  mergeSavedEvaluationByEvaluator,
} from './utils';

type EvaluationRecord = EvaluationSummary;

interface TestingResultsSyncInput {
  evaluation: EvaluationRecord | null;
  setTestingResults: Dispatch<SetStateAction<TestingResult[]>>;
  testingResultsRef: MutableRefObject<TestingResult[]>;
}

interface ExistingEvaluationRefreshInput {
  evaluations?: EvaluationRecord[] | EvaluationRecord | null;
  applicantData: EvaluationApplicantLike | null;
  setAllEvaluations: Dispatch<SetStateAction<Map<string, EvaluationRecord>>>;
  setExistingEvaluation: Dispatch<SetStateAction<EvaluationRecord | null>>;
  setSelectedInterviewerId: Dispatch<SetStateAction<string | null>>;
  setRemarkText: Dispatch<SetStateAction<string>>;
  syncTestingResultsWithEvaluation: (evaluation: EvaluationRecord | null) => void;
}

interface InterviewerSelectionInput {
  interviewerId: string;
  evaluation: EvaluationRecord | null;
  applicantData: EvaluationApplicantLike | null;
  setSelectedInterviewerId: Dispatch<SetStateAction<string | null>>;
  setRemarkText: Dispatch<SetStateAction<string>>;
  setExistingEvaluation: Dispatch<SetStateAction<EvaluationRecord | null>>;
  setFormData: Dispatch<SetStateAction<EvaluationFormData | null>>;
  syncTestingResultsWithEvaluation: (evaluation: EvaluationRecord | null) => void;
}

interface UseExistingEvaluationStateInput {
  allEvaluations: Map<string, EvaluationRecord>;
  selectedInterviewerId: string | null;
  applicantData: EvaluationApplicantLike | null;
  setAllEvaluations: Dispatch<SetStateAction<Map<string, EvaluationRecord>>>;
  setExistingEvaluation: Dispatch<SetStateAction<EvaluationRecord | null>>;
  setSelectedInterviewerId: Dispatch<SetStateAction<string | null>>;
  setRemarkText: Dispatch<SetStateAction<string>>;
  setTestingResults: Dispatch<SetStateAction<TestingResult[]>>;
  testingResultsRef: MutableRefObject<TestingResult[]>;
  setFormData: Dispatch<SetStateAction<EvaluationFormData | null>>;
}

export function syncTestingResultsWithExistingEvaluation({
  evaluation,
  setTestingResults,
  testingResultsRef,
}: TestingResultsSyncInput) {
  setTestingResults(prev => {
    const updated = applyEvaluationExpertiseScoresToTestingResults(prev, evaluation);
    testingResultsRef.current = updated;
    return updated;
  });
}

export function refreshExistingEvaluationState({
  evaluations,
  applicantData,
  setAllEvaluations,
  setExistingEvaluation,
  setSelectedInterviewerId,
  setRemarkText,
  syncTestingResultsWithEvaluation,
}: ExistingEvaluationRefreshInput) {
  const refreshState = buildExistingEvaluationRefreshState(evaluations);
  setAllEvaluations(refreshState.evaluationsMap);
  setExistingEvaluation(refreshState.existingEvaluation);

  if (refreshState.selectedInterviewerId) {
    setSelectedInterviewerId(refreshState.selectedInterviewerId);
  }

  setRemarkText(getSharedInterviewRemarks(applicantData));

  if (refreshState.existingEvaluation) {
    syncTestingResultsWithEvaluation(refreshState.existingEvaluation);
  }
}

export function applyInterviewerSelection({
  interviewerId,
  evaluation,
  applicantData,
  setSelectedInterviewerId,
  setRemarkText,
  setExistingEvaluation,
  setFormData,
  syncTestingResultsWithEvaluation,
}: InterviewerSelectionInput) {
  setSelectedInterviewerId(interviewerId);
  setRemarkText(getSharedInterviewRemarks(applicantData));
  setExistingEvaluation(evaluation);
  setFormData(prev => applySelectedInterviewerEvaluationToFormData(prev, evaluation));

  if (evaluation) {
    syncTestingResultsWithEvaluation(evaluation);
  }
}

export function useExistingEvaluationState({
  allEvaluations,
  selectedInterviewerId,
  applicantData,
  setAllEvaluations,
  setExistingEvaluation,
  setSelectedInterviewerId,
  setRemarkText,
  setTestingResults,
  testingResultsRef,
  setFormData,
}: UseExistingEvaluationStateInput) {
  const syncTestingResultsWithEvaluation = useCallback((evaluation: EvaluationRecord | null) => {
    syncTestingResultsWithExistingEvaluation({
      evaluation,
      setTestingResults,
      testingResultsRef,
    });
  }, [setTestingResults, testingResultsRef]);

  const applySavedEvaluation = useCallback((savedEvaluation: EvaluationRecord) => {
    const { evaluationsMap, evaluatorId } = mergeSavedEvaluationByEvaluator(allEvaluations, savedEvaluation);

    if (evaluatorId) {
      setAllEvaluations(evaluationsMap);
      if (selectedInterviewerId === evaluatorId) {
        setExistingEvaluation(savedEvaluation);
      }
    }

    return evaluationsMap;
  }, [allEvaluations, selectedInterviewerId, setAllEvaluations, setExistingEvaluation]);

  const applyExistingEvaluationRefreshState = useCallback((evaluations?: EvaluationRecord[] | EvaluationRecord | null) => {
    refreshExistingEvaluationState({
      evaluations,
      applicantData,
      setAllEvaluations,
      setExistingEvaluation,
      setSelectedInterviewerId,
      setRemarkText,
      syncTestingResultsWithEvaluation,
    });
  }, [
    applicantData,
    setAllEvaluations,
    setExistingEvaluation,
    setRemarkText,
    setSelectedInterviewerId,
    syncTestingResultsWithEvaluation,
  ]);

  const handleInterviewerSelect = useCallback((interviewerId: string, evaluation: EvaluationRecord | null) => {
    applyInterviewerSelection({
      interviewerId,
      evaluation,
      applicantData,
      setSelectedInterviewerId,
      setRemarkText,
      setExistingEvaluation,
      setFormData,
      syncTestingResultsWithEvaluation,
    });
  }, [
    applicantData,
    setExistingEvaluation,
    setFormData,
    setRemarkText,
    setSelectedInterviewerId,
    syncTestingResultsWithEvaluation,
  ]);

  return {
    applySavedEvaluation,
    applyExistingEvaluationRefreshState,
    handleInterviewerSelect,
    syncTestingResultsWithEvaluation,
  };
}
