import type { EvaluationRecord, GroupedTrait } from "./types";

export const getTraitScoresByEvaluator = (traitId: string, allEvaluations: EvaluationRecord[]) => {
  const scores: Array<{ evaluatorId: string; evaluatorName: string; score: number }> = [];

  allEvaluations.forEach((evaluation) => {
    const traitScore = evaluation.personalityScores?.find(
      (personalityScore) => personalityScore.trait?.id === traitId,
    );
    if (traitScore && evaluation.evaluator?.id) {
      scores.push({
        evaluatorId: evaluation.evaluator.id,
        evaluatorName: evaluation.evaluator.name || "Unknown",
        score: traitScore.score,
      });
    }
  });

  return scores;
};

export const getEvaluatorsForGroup = (
  group: GroupedTrait,
  allEvaluations: EvaluationRecord[],
) => {
  const evaluatorMap = new Map<string, { id: string; name: string }>();

  group.traits.forEach((trait) => {
    const scores = getTraitScoresByEvaluator(trait.id, allEvaluations);
    scores.forEach((score) => {
      if (!evaluatorMap.has(score.evaluatorId)) {
        evaluatorMap.set(score.evaluatorId, {
          id: score.evaluatorId,
          name: score.evaluatorName,
        });
      }
    });
  });

  return Array.from(evaluatorMap.values());
};

export const getTraitScoreByEvaluator = (
  traitId: string,
  evaluatorId: string,
  allEvaluations: EvaluationRecord[],
): number | null => {
  const evaluation = allEvaluations.find((item) => item.evaluator?.id === evaluatorId);
  if (!evaluation) {
    return null;
  }

  const traitScore = evaluation.personalityScores?.find(
    (personalityScore) => personalityScore.trait?.id === traitId,
  );
  return traitScore?.score ?? null;
};
