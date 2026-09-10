import { buildExpertiseScoresForSave } from './evaluation-expertise-utils';
import type { BuildEvaluationSavePayloadInput } from './evaluation-form-state-types';
import { buildPersonalityScoresForSave } from './evaluation-personality-question-utils';

export function buildEvaluationSavePayload({
  applicantPositionId,
  evaluatorId,
  questions,
  testingResults,
  overallScore,
  comments,
  status,
}: BuildEvaluationSavePayloadInput) {
  return {
    positionId: applicantPositionId || undefined,
    evaluatorId: evaluatorId || undefined,
    personalityScores: buildPersonalityScoresForSave(questions),
    expertiseScores: buildExpertiseScoresForSave(testingResults),
    overallScore: overallScore || 0,
    comments: comments || '',
    status,
  };
}
