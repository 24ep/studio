import type {
  AveragedEvaluationData,
  EvaluationRecord,
  EvaluationSkill,
  EvaluationTrait,
} from "./types";

export const formatPersonalityScore = (score: number): string => {
  return Math.round(score).toString();
};

function averageScores(scores: number[]) {
  return scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
}

export function buildAveragedEvaluationData(
  evaluations: EvaluationRecord[] | null | undefined,
): AveragedEvaluationData | null {
  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return null;
  }

  const traitScoreMap = new Map<string, { scores: number[]; trait: EvaluationTrait }>();
  const skillScoreMap = new Map<string, { scores: number[]; skill: EvaluationSkill }>();
  const uniqueEvaluatorIds = new Set<string>();
  const overallScores: number[] = [];

  for (const evaluation of evaluations) {
    collectEvaluationOverallScore(evaluation, overallScores, uniqueEvaluatorIds);
    collectEvaluationTraitScores(evaluation, traitScoreMap);
    collectEvaluationSkillScores(evaluation, skillScoreMap);
  }

  return {
    overallScore: averageScores(overallScores),
    personalityScores: Array.from(traitScoreMap.values()).map(({ trait, scores }) => ({
      trait,
      averageScore: averageScores(scores),
      evaluatorCount: scores.length,
    })),
    evaluatorCount: uniqueEvaluatorIds.size > 0 ? uniqueEvaluatorIds.size : evaluations.length,
    expertiseScores: Array.from(skillScoreMap.values()).map(({ skill, scores }) => ({
      skill,
      averageScore: averageScores(scores),
      evaluatorCount: scores.length,
    })),
  };
}

function collectEvaluationOverallScore(
  evaluation: EvaluationRecord,
  overallScores: number[],
  uniqueEvaluatorIds: Set<string>,
) {
  if (evaluation.evaluator?.id) {
    uniqueEvaluatorIds.add(evaluation.evaluator.id);
  }

  if (evaluation.overallScore !== null && evaluation.overallScore !== undefined) {
    overallScores.push(evaluation.overallScore);
  }
}

function collectEvaluationTraitScores(
  evaluation: EvaluationRecord,
  traitScoreMap: Map<string, { scores: number[]; trait: EvaluationTrait }>,
) {
  if (!Array.isArray(evaluation.personalityScores)) {
    return;
  }

  for (const personalityScore of evaluation.personalityScores) {
    if (personalityScore.trait && personalityScore.score !== undefined && personalityScore.score !== null) {
      const traitId = personalityScore.trait.id;
      if (!traitScoreMap.has(traitId)) {
        traitScoreMap.set(traitId, { scores: [], trait: personalityScore.trait });
      }
      traitScoreMap.get(traitId)?.scores.push(personalityScore.score);
    }
  }
}

function collectEvaluationSkillScores(
  evaluation: EvaluationRecord,
  skillScoreMap: Map<string, { scores: number[]; skill: EvaluationSkill }>,
) {
  if (!Array.isArray(evaluation.expertiseScores)) {
    return;
  }

  for (const expertiseScore of evaluation.expertiseScores) {
    if (expertiseScore.skill && expertiseScore.score !== undefined && expertiseScore.score !== null) {
      const skillId = expertiseScore.skill.id;
      if (!skillScoreMap.has(skillId)) {
        skillScoreMap.set(skillId, { scores: [], skill: expertiseScore.skill });
      }
      skillScoreMap.get(skillId)?.scores.push(expertiseScore.score);
    }
  }
}

export function buildAveragedEvaluationDataFromSingleEvaluation(
  data: EvaluationRecord | null | undefined,
): AveragedEvaluationData | null {
  if (!data) {
    return null;
  }

  return {
    overallScore: data.overallScore || 0,
    personalityScores: (Array.isArray(data.personalityScores) ? data.personalityScores : []).map((personalityScore) => ({
      trait: personalityScore.trait,
      averageScore: personalityScore.score,
      evaluatorCount: 1,
    })),
    evaluatorCount: 1,
    expertiseScores: (Array.isArray(data.expertiseScores) ? data.expertiseScores : []).map((expertiseScore) => ({
      skill: expertiseScore.skill,
      averageScore: expertiseScore.score,
      evaluatorCount: 1,
    })),
  };
}
