import type {
  EvaluationPersonalityScoreSummary,
  EvaluationQuestion,
} from './types';

export interface PersonalityScoreValue {
  score: number;
  notes: string;
}

export interface ApplyPersonalityScoresOptions {
  missingScore?: PersonalityScoreValue;
}

function isPersonalityScoreWithTraitId(
  value: unknown
): value is EvaluationPersonalityScoreSummary & { traitId: string } {
  return Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { traitId?: unknown }).traitId === 'string';
}

function toPersonalityScoreValue(score: EvaluationPersonalityScoreSummary): PersonalityScoreValue {
  return {
    score: typeof score.score === 'number' ? score.score : 0,
    notes: score.notes || '',
  };
}

export function buildPersonalityScoresByTraitId(scores?: unknown[] | null) {
  if (!Array.isArray(scores)) {
    return new Map<string, PersonalityScoreValue>();
  }

  return new Map<string, PersonalityScoreValue>(
    scores
      .filter(isPersonalityScoreWithTraitId)
      .map(score => [score.traitId, toPersonalityScoreValue(score)])
  );
}

export function applyPersonalityScoresToQuestions(
  questions: EvaluationQuestion[],
  scores?: unknown[] | null,
  options: ApplyPersonalityScoresOptions = {}
) {
  const personalityScoresMap = buildPersonalityScoresByTraitId(scores);

  if (personalityScoresMap.size === 0 && !options.missingScore) {
    return questions;
  }

  return questions.map(question => {
    const existingScore = personalityScoresMap.get(question.traitId);
    if (existingScore) {
      return { ...question, score: existingScore.score, notes: existingScore.notes };
    }

    return options.missingScore
      ? { ...question, score: options.missingScore.score, notes: options.missingScore.notes }
      : question;
  });
}
