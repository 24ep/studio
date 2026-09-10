import type {
  UpdateEvaluationInput,
  UpdateExpertiseScoreInput,
  UpdatePersonalityScoreInput,
} from './applicant-evaluation-detail-schema';

function dedupeScores<TScore, TKey extends string>(
  scores: TScore[] | undefined,
  getKey: (score: TScore) => TKey
) {
  return scores ? Array.from(new Map(scores.map(score => [getKey(score), score])).values()) : undefined;
}

export function dedupeEvaluationDetailScores(input: UpdateEvaluationInput) {
  return {
    personalityScores: dedupeScores(input.personalityScores, score => score.traitId),
    expertiseScores: dedupeScores(input.expertiseScores, score => score.skillId),
  };
}

export function mapDetailPersonalityScores(scores: UpdatePersonalityScoreInput[]) {
  return scores.map(score => ({
    traitId: score.traitId,
    score: score.score,
    notes: score.notes || '',
  }));
}

export function mapDetailExpertiseScores(scores: UpdateExpertiseScoreInput[]) {
  return scores.map(score => ({
    skillId: score.skillId,
    score: score.score,
    notes: score.notes || '',
  }));
}
