import React from 'react';
import { toast } from 'react-hot-toast';
import type { TestingResult } from './types';
import { buildEvaluationTestResultRemovalAction } from './utils';

interface UseEvaluationAdminActionsInput {
  applicantId: string;
  positionId: string | null;
  testingResults: TestingResult[];
  setTestingResults: React.Dispatch<React.SetStateAction<TestingResult[]>>;
  refreshEvaluationData: () => void | Promise<void>;
}

export function useEvaluationAdminActions({
  applicantId,
  positionId,
  testingResults,
  setTestingResults,
  refreshEvaluationData,
}: UseEvaluationAdminActionsInput) {
  const handleResetEvaluation = React.useCallback(async (_interviewerId: string, evaluationId: string) => {
    if (!evaluationId) return;

    const confirmed = window.confirm('Are you sure you want to reset this evaluation? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/applicants/${applicantId}/evaluation/${evaluationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset evaluation');
      }

      toast.success('Evaluation reset successfully');
      await refreshEvaluationData();
    } catch (err) {
      console.error('Error resetting evaluation:', err);
      toast.error('Failed to reset evaluation');
    }
  }, [applicantId, refreshEvaluationData]);

  const handleRemoveInterviewer = React.useCallback(async (interviewerId: string) => {
    if (!positionId) {
      toast.error('Position not found');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to remove this interviewer from the position?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/positions/${positionId}/interviewers/${interviewerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove interviewer');
      }

      toast.success('Interviewer removed successfully');
      await refreshEvaluationData();
    } catch (err) {
      console.error('Error removing interviewer:', err);
      toast.error('Failed to remove interviewer');
    }
  }, [positionId, refreshEvaluationData]);

  const handleRemoveTestResult = React.useCallback(async (index: number) => {
    const action = buildEvaluationTestResultRemovalAction({
      positionId,
      testResult: testingResults[index],
    });

    if (action.type === 'invalid') {
      toast.error(action.message);
      if (action.message.includes('unknown assignment type')) {
        await refreshEvaluationData();
      }
      return;
    }

    if (action.type === 'group' && !window.confirm(action.confirmationMessage)) {
      return;
    }

    try {
      const response = await fetch(action.url, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(action.failureMessage);
      }

      toast.success(action.successMessage);
      if (action.removeLocalResult) {
        setTestingResults(prev => prev.filter((_, resultIndex) => resultIndex !== index));
      }
      await refreshEvaluationData();
    } catch (err) {
      console.error('Error removing test result:', err);
      toast.error(action.failureMessage);
    }
  }, [positionId, refreshEvaluationData, setTestingResults, testingResults]);

  return {
    handleResetEvaluation,
    handleRemoveInterviewer,
    handleRemoveTestResult,
  };
}
