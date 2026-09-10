import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { EvaluationFormData, TestingResult } from './types';
import {
  moveEvaluationQuestion,
  updateEvaluationComments,
  updateEvaluationQuestionNotes,
  updateEvaluationQuestionScore,
} from './utils';

interface UseEvaluationFormInteractionsInput {
  formData: EvaluationFormData | null;
  setFormData: Dispatch<SetStateAction<EvaluationFormData | null>>;
  setTestingResults: Dispatch<SetStateAction<TestingResult[]>>;
  testingResultsRef: MutableRefObject<TestingResult[]>;
  triggerAutoSave: (
    questions: EvaluationFormData['questions'],
    overallScore: number,
    comments?: string
  ) => void;
  triggerTestingResultsAutoSave: () => void;
}

export function useEvaluationFormInteractions({
  formData,
  setFormData,
  setTestingResults,
  testingResultsRef,
  triggerAutoSave,
  triggerTestingResultsAutoSave,
}: UseEvaluationFormInteractionsInput) {
  const handleScoreChange = useCallback((questionId: string, score: number) => {
    setFormData(prevFormData => {
      const update = updateEvaluationQuestionScore(prevFormData, questionId, score);
      if (!update) return prevFormData;

      setTimeout(() => {
        triggerAutoSave(update.questions, update.overallScore);
      }, 0);

      if (update.shouldAutoAdvance) {
        setTimeout(() => {
          setFormData(prev => {
            if (prev && prev.currentQuestionIndex === update.currentQuestionIndex) {
              return {
                ...prev,
                currentQuestionIndex: update.currentQuestionIndex + 1,
              };
            }
            return prev;
          });
        }, 300);
      }

      return update.formData;
    });
  }, [setFormData, triggerAutoSave]);

  const handleNotesChange = useCallback((questionId: string, notes: string) => {
    const update = updateEvaluationQuestionNotes(formData, questionId, notes);
    if (!update) return;

    setFormData(update.formData);
    triggerAutoSave(update.questions, update.overallScore);
  }, [formData, setFormData, triggerAutoSave]);

  const handleCommentsChange = useCallback((comments: string) => {
    const updatedFormData = updateEvaluationComments(formData, comments);
    if (!updatedFormData) return;

    setFormData(updatedFormData);
    triggerAutoSave(updatedFormData.questions, updatedFormData.overallScore, comments);
  }, [formData, setFormData, triggerAutoSave]);

  const handlePrevious = useCallback(() => {
    setFormData(prev => moveEvaluationQuestion(prev, 'previous'));
  }, [setFormData]);

  const handleNext = useCallback(() => {
    setFormData(prev => moveEvaluationQuestion(prev, 'next'));
  }, [setFormData]);

  const updateTestingResultScore = useCallback((index: number, score: number, autoSave = false) => {
    setTestingResults(prev => {
      const updated = prev.map((result, resultIndex) =>
        resultIndex === index ? { ...result, score } : result
      );
      testingResultsRef.current = updated;
      return updated;
    });

    if (autoSave) {
      triggerTestingResultsAutoSave();
    }
  }, [setTestingResults, testingResultsRef, triggerTestingResultsAutoSave]);

  return {
    handleScoreChange,
    handleNotesChange,
    handleCommentsChange,
    handlePrevious,
    handleNext,
    updateTestingResultScore,
  };
}
