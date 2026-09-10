import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  EvaluationWaitingInterviewer,
  WaitingEvaluation,
} from './evaluation-waiting-types';
import { readJsonOrFallback } from '@/lib/response-json';
import {
  buildWaitingEvaluationsMap,
  countCompletedWaitingInterviewers,
  haveAllWaitingInterviewersCompleted,
} from './evaluation-waiting-utils';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';

interface UseEvaluationWaitingPollerInput {
  applicantId: string;
  interviewers: EvaluationWaitingInterviewer[];
  initialEvaluations: Map<string, WaitingEvaluation>;
  onEvaluationsUpdate?: (evaluations: Map<string, WaitingEvaluation>) => void;
  onAllCompleted: () => void;
  onCompletedNavigate: () => void;
  pollingIntervalMs?: number;
}

export function useEvaluationWaitingPoller({
  applicantId,
  interviewers,
  initialEvaluations,
  onEvaluationsUpdate,
  onAllCompleted,
  onCompletedNavigate,
  pollingIntervalMs = 3000,
}: UseEvaluationWaitingPollerInput) {
  const [isPolling, setIsPolling] = useState(true);
  const [currentEvaluations, setCurrentEvaluations] = useState(initialEvaluations);

  useEffect(() => {
    setCurrentEvaluations(initialEvaluations);
  }, [initialEvaluations]);

  const completedCount = useMemo(() => (
    countCompletedWaitingInterviewers(interviewers, currentEvaluations)
  ), [interviewers, currentEvaluations]);

  const pollEvaluations = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/applicants/${applicantId}/evaluations`, {
        cache: 'no-store',
      });

      if (!response.ok) return;

      const evaluationsMap = buildWaitingEvaluationsMap(
        await readJsonOrFallback<unknown>(response, [])
      );
      setCurrentEvaluations(evaluationsMap);
      onEvaluationsUpdate?.(evaluationsMap);

      if (haveAllWaitingInterviewersCompleted(interviewers, evaluationsMap)) {
        setIsPolling(false);
        onAllCompleted();
        onCompletedNavigate();
      }
    } catch (error) {
      console.error('Error polling evaluations:', error);
    }
  }, [
    applicantId,
    interviewers,
    onAllCompleted,
    onCompletedNavigate,
    onEvaluationsUpdate,
  ]);

  useVisibilityInterval(pollEvaluations, pollingIntervalMs, isPolling);

  return {
    completedCount,
    currentEvaluations,
    totalCount: interviewers.length,
  };
}
