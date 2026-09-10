import type { TestingResult } from './types';
import { applyExpertiseScoresToTestingResults } from './evaluation-expertise-utils';

type InterviewerLike = {
  userId?: string | null;
};

interface DefaultEvaluationInterviewerInput {
  loading: boolean;
  loadingEvaluation: boolean;
  selectedInterviewerId?: string | null;
  interviewers?: InterviewerLike[] | null;
}

export type EvaluationLike = {
  evaluator?: {
    id?: string | null;
  } | null;
  status?: string | null;
  personalityScores?: unknown[] | null;
  overallScore?: number | null;
};

export function buildEvaluationsByInterviewer(evaluations?: EvaluationLike[] | EvaluationLike | null) {
  const evaluationsMap = new Map<string, EvaluationLike>();
  const evaluationsArray = Array.isArray(evaluations)
    ? evaluations
    : (evaluations ? [evaluations] : []);

  for (const evaluation of evaluationsArray) {
    const evaluatorId = evaluation?.evaluator?.id;
    if (evaluatorId) {
      evaluationsMap.set(evaluatorId, evaluation);
    }
  }

  return evaluationsMap;
}

export function buildExistingEvaluationLoadState<T extends EvaluationLike>({
  testingResults,
  evaluations,
  selectedInterviewerId,
  scoreSource = 'all-evaluations',
}: {
  testingResults: TestingResult[];
  evaluations?: T[] | T | null;
  selectedInterviewerId?: string | null;
  scoreSource?: 'all-evaluations' | 'selected-evaluation';
}) {
  const evaluationsArray = Array.isArray(evaluations)
    ? evaluations
    : (evaluations ? [evaluations] : []);
  const existingEvaluation = selectEvaluationForInterviewer(evaluationsArray, selectedInterviewerId);
  const evaluationsForScores = scoreSource === 'selected-evaluation'
    ? (existingEvaluation ? [existingEvaluation] : [])
    : evaluationsArray;

  return {
    evaluationsMap: buildEvaluationsByInterviewer(evaluationsArray),
    existingEvaluation,
    testingResults: applyExpertiseScoresToTestingResults(testingResults, evaluationsForScores),
  };
}

export function buildExistingEvaluationRefreshState<T extends EvaluationLike>(
  evaluations?: T[] | T | null
) {
  const evaluationsMap = buildEvaluationsByInterviewer(evaluations);
  const existingEvaluation = getFirstEvaluationFromMap(evaluationsMap);

  return {
    evaluationsMap,
    existingEvaluation,
    selectedInterviewerId: existingEvaluation?.evaluator?.id || null,
  };
}

export function mergeSavedEvaluationByEvaluator<T extends EvaluationLike>(
  evaluationsMap: Map<string, T>,
  savedEvaluation?: T | null
) {
  const updatedMap = new Map(evaluationsMap);
  const evaluatorId = savedEvaluation?.evaluator?.id || null;

  if (evaluatorId && savedEvaluation) {
    updatedMap.set(evaluatorId, savedEvaluation);
  }

  return {
    evaluationsMap: updatedMap,
    evaluatorId,
  };
}

export function getFirstEvaluationFromMap<T>(evaluationsMap: Map<string, T>) {
  return evaluationsMap.values().next().value ?? null;
}

export function selectEvaluationForInterviewer<T extends EvaluationLike>(
  evaluations?: T[] | null,
  selectedInterviewerId?: string | null
) {
  const evaluationsArray = Array.isArray(evaluations) ? evaluations : [];
  if (evaluationsArray.length === 0) return null;

  if (selectedInterviewerId) {
    return evaluationsArray.find(evaluation => evaluation?.evaluator?.id === selectedInterviewerId) || null;
  }

  return evaluationsArray[0];
}

export function isEvaluationComplete(evaluation?: EvaluationLike | null) {
  if (!evaluation) return false;

  const status = String(evaluation.status || '').toLowerCase().trim();
  if (status === 'completed') return true;

  const hasPersonalityScores = Array.isArray(evaluation.personalityScores) &&
    evaluation.personalityScores.length > 0;
  const hasOverallScore = evaluation.overallScore !== null &&
    evaluation.overallScore !== undefined;

  return hasPersonalityScores || hasOverallScore;
}

export function haveAllInterviewersCompleted(
  interviewers: InterviewerLike[],
  evaluationsMap: Map<string, EvaluationLike>
) {
  return interviewers.length > 0 &&
    interviewers.every(interviewer => isEvaluationComplete(
      interviewer.userId ? evaluationsMap.get(interviewer.userId) : null
    ));
}

export function getDefaultEvaluationInterviewerId({
  loading,
  loadingEvaluation,
  selectedInterviewerId,
  interviewers,
}: DefaultEvaluationInterviewerInput) {
  if (loading || loadingEvaluation || selectedInterviewerId) {
    return null;
  }

  const firstInterviewerId = Array.isArray(interviewers) ? interviewers[0]?.userId : null;
  return firstInterviewerId || null;
}
