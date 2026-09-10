import type {
  EvaluationQuestion,
  EvaluationSummary,
} from './types';
import type { EvaluationCriteriaLike } from './evaluation-form-state-types';
import {
  buildBasePersonalityEvaluationQuestions,
  sortPersonalityGroupsByDisplayOrder,
} from './evaluation-personality-question-builders';
import { applyPersonalityScoresToQuestions } from './evaluation-personality-score-map-utils';

export const formatPersonalityScore = (score: number): string => {
  if (score % 1 === 0) {
    return score.toString();
  }

  return score.toFixed(1);
};

export { sortPersonalityGroupsByDisplayOrder };

function applyExistingPersonalityScores(
  questions: EvaluationQuestion[],
  existingEval?: EvaluationSummary | null
) {
  return applyPersonalityScoresToQuestions(questions, existingEval?.personalityScores);
}

export function buildPersonalityEvaluationQuestions(
  evaluationCriteria: EvaluationCriteriaLike,
  existingEval?: EvaluationSummary | null,
  idSuffix: string | number = Date.now()
) {
  const questions: EvaluationQuestion[] = [];
  questions.push(...buildBasePersonalityEvaluationQuestions(evaluationCriteria, idSuffix));
  return applyExistingPersonalityScores(questions, existingEval);
}

export function calculateOverallEvaluationScore(
  questions: EvaluationQuestion[],
  existingEval?: EvaluationSummary | null
) {
  if (existingEval?.overallScore !== undefined && existingEval?.overallScore !== null) {
    return existingEval.overallScore;
  }

  return questions.length > 0
    ? questions.reduce((sum, question) => sum + (question.score || 0), 0) / questions.length
    : 0;
}

export function buildPersonalityScoresForSave(questions: EvaluationQuestion[]) {
  return questions
    .filter(question => question.score >= 1 && question.score <= 5 && question.traitId && question.traitId.trim() !== '')
    .map(question => ({
      traitId: question.traitId,
      score: question.score,
      notes: '',
    }));
}
