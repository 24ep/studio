import type {
  EvaluationWaitingInterviewer,
  WaitingEvaluation,
} from './evaluation-waiting-types';

export function isWaitingEvaluation(value: unknown): value is WaitingEvaluation {
  return typeof value === 'object' && value !== null;
}

export function getWaitingEvaluationEvaluatorId(evaluation: WaitingEvaluation) {
  return evaluation.evaluator?.id || null;
}

export function buildWaitingEvaluationsMap(data: unknown) {
  const evaluationsMap = new Map<string, WaitingEvaluation>();
  const evaluations = Array.isArray(data) ? data : [data];

  for (const evaluation of evaluations) {
    if (!isWaitingEvaluation(evaluation)) continue;

    const evaluatorId = getWaitingEvaluationEvaluatorId(evaluation);
    if (evaluatorId) {
      evaluationsMap.set(evaluatorId, evaluation);
    }
  }

  return evaluationsMap;
}

export function isWaitingEvaluationComplete(evaluation?: WaitingEvaluation | null) {
  if (!evaluation) return false;

  const status = String(evaluation.status || '').toLowerCase().trim();
  if (status === 'completed') return true;

  const hasPersonalityScores = Array.isArray(evaluation.personalityScores) &&
    evaluation.personalityScores.length > 0;
  const hasExpertiseScores = Array.isArray(evaluation.expertiseScores) &&
    evaluation.expertiseScores.length > 0;
  const hasOverallScore = evaluation.overallScore !== null &&
    evaluation.overallScore !== undefined;

  return hasPersonalityScores || hasExpertiseScores || hasOverallScore;
}

export function countCompletedWaitingInterviewers(
  interviewers: Array<Pick<EvaluationWaitingInterviewer, 'userId'>>,
  evaluations: Map<string, WaitingEvaluation>
) {
  return interviewers.filter(interviewer => (
    isWaitingEvaluationComplete(evaluations.get(interviewer.userId))
  )).length;
}

export function haveAllWaitingInterviewersCompleted(
  interviewers: Array<Pick<EvaluationWaitingInterviewer, 'userId'>>,
  evaluations: Map<string, WaitingEvaluation>
) {
  return interviewers.length > 0 &&
    countCompletedWaitingInterviewers(interviewers, evaluations) === interviewers.length;
}

export function getEvaluationWaitingProgressPercent(completedCount: number, totalCount: number) {
  if (totalCount <= 0) return 0;
  return Math.min(100, Math.max(0, (completedCount / totalCount) * 100));
}

export function getEvaluationWaitingRemainingLabel(completedCount: number, totalCount: number) {
  if (completedCount === totalCount && totalCount > 0) {
    return 'All interviewers completed!';
  }

  const remainingCount = Math.max(0, totalCount - completedCount);
  return `${remainingCount} interviewer${remainingCount !== 1 ? 's' : ''} remaining`;
}
