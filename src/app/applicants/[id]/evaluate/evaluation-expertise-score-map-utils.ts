import type { EvaluationExpertiseScoreSummary, EvaluationSummary, TestingResult } from './types';

function isExpertiseScoreWithSkillId(
  expertiseScore: unknown
): expertiseScore is EvaluationExpertiseScoreSummary & { skillId: string } {
  return Boolean(expertiseScore) &&
    typeof expertiseScore === 'object' &&
    typeof (expertiseScore as { skillId?: unknown }).skillId === 'string' &&
    (expertiseScore as { score?: unknown }).score !== undefined &&
    (expertiseScore as { score?: unknown }).score !== null;
}

function getScoreValue(expertiseScore: EvaluationExpertiseScoreSummary) {
  return typeof expertiseScore.score === 'number' ? expertiseScore.score : 0;
}

function shouldReplaceExpertiseScore(
  existingEntry: { createdAt: string } | undefined,
  createdAt: string
) {
  return !existingEntry || (createdAt !== '' && existingEntry.createdAt !== '' && createdAt > existingEntry.createdAt);
}

export function buildLatestExpertiseScoreMap(evaluations: EvaluationSummary[]) {
  const scoresMap = new Map<string, { score: number; createdAt: string }>();

  for (const evaluation of evaluations) {
    const createdAt = evaluation.createdAt || '';

    for (const expertiseScore of evaluation?.expertiseScores || []) {
      if (!isExpertiseScoreWithSkillId(expertiseScore)) {
        continue;
      }

      const existingEntry = scoresMap.get(expertiseScore.skillId);
      if (shouldReplaceExpertiseScore(existingEntry, createdAt)) {
        scoresMap.set(expertiseScore.skillId, {
          score: getScoreValue(expertiseScore),
          createdAt,
        });
      }
    }
  }

  return new Map(Array.from(scoresMap.entries()).map(([skillId, value]) => [skillId, value.score]));
}

export function applyExpertiseScoreMap(testingResults: TestingResult[], latestScoreMap: Map<string, number>) {
  if (latestScoreMap.size === 0) {
    return testingResults;
  }

  return testingResults.map(skill => {
    const latestScore = latestScoreMap.get(skill.id);
    return latestScore === undefined
      ? skill
      : { ...skill, score: latestScore };
  });
}
