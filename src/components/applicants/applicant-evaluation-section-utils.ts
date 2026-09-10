export interface EvaluationData {
  id: string;
  status: string;
  overallScore: number | null;
  comments?: string | null;
  evaluator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  expertiseScores: Array<{
    id: string;
    score: number;
    skill: {
      id: string;
      name: string;
      maxScore: number;
      group: {
        id: string;
        name: string;
        color: string;
      } | null;
    };
  }>;
  personalityScores: Array<{
    id: string;
    score: number;
    trait: {
      id: string;
      name: string;
      group: {
        id: string;
        name: string;
        color: string;
      } | null;
    };
  }>;
}

export interface GroupedSkill {
  groupId: string;
  groupName: string;
  groupColor: string;
  skills: Array<{
    id: string;
    name: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>;
}

export interface GroupedTrait {
  groupId: string;
  groupName: string;
  groupColor: string;
  traits: Array<{
    id: string;
    name: string;
    score: number;
    percentage: number;
  }>;
}

export function buildAveragedEvaluation(evaluations: EvaluationData[]) {
  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return null;
  }

  const traitScoreMap = new Map<string, { scores: number[]; trait: EvaluationData["personalityScores"][number]["trait"] }>();
  let totalOverallScore = 0;
  let overallScoreCount = 0;

  evaluations.forEach((evaluation) => {
    if (evaluation.overallScore !== null && evaluation.overallScore !== undefined) {
      totalOverallScore += evaluation.overallScore;
      overallScoreCount++;
    }

    evaluation.personalityScores?.forEach((personalityScore) => {
      if (!personalityScore.trait || !personalityScore.score) {
        return;
      }

      const traitId = personalityScore.trait.id;
      if (!traitScoreMap.has(traitId)) {
        traitScoreMap.set(traitId, { scores: [], trait: personalityScore.trait });
      }
      traitScoreMap.get(traitId)?.scores.push(personalityScore.score);
    });
  });

  const averagedPersonalityScores = Array.from(traitScoreMap.entries()).map(([traitId, data]) => ({
    id: traitId,
    score: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
    trait: data.trait,
  }));

  return {
    id: evaluations[0].id,
    status: evaluations[0].status,
    overallScore: overallScoreCount > 0 ? totalOverallScore / overallScoreCount : null,
    personalityScores: averagedPersonalityScores,
    expertiseScores: evaluations[0].expertiseScores || [],
  } satisfies EvaluationData;
}

export function calculateExpertiseAverage(evaluation: EvaluationData | null) {
  if (!evaluation?.expertiseScores?.length) {
    return 0;
  }

  const totalPercentage = evaluation.expertiseScores.reduce((sum, expertiseScore) => (
    sum + (expertiseScore.score / expertiseScore.skill.maxScore) * 100
  ), 0);

  return totalPercentage / evaluation.expertiseScores.length;
}

export function calculatePersonalityAverage(evaluation: EvaluationData | null) {
  if (!evaluation?.personalityScores?.length) {
    return 0;
  }

  const totalPercentage = evaluation.personalityScores.reduce((sum, personalityScore) => (
    sum + ((personalityScore.score - 1) / 4) * 100
  ), 0);

  return totalPercentage / evaluation.personalityScores.length;
}

export function groupExpertiseSkills(evaluation: EvaluationData | null): GroupedSkill[] {
  if (!evaluation?.expertiseScores) return [];

  const groupMap = new Map<string, GroupedSkill>();

  evaluation.expertiseScores.forEach((expertiseScore) => {
    const group = expertiseScore.skill.group;
    const groupId = group?.id || "ungrouped";

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        groupId,
        groupName: group?.name || "No Group",
        groupColor: group?.color || "#6B7280",
        skills: [],
      });
    }

    groupMap.get(groupId)?.skills.push({
      id: expertiseScore.skill.id,
      name: expertiseScore.skill.name,
      score: expertiseScore.score,
      maxScore: expertiseScore.skill.maxScore,
      percentage: (expertiseScore.score / expertiseScore.skill.maxScore) * 100,
    });
  });

  return Array.from(groupMap.values());
}

export function formatPersonalityScore(score: number) {
  return score % 1 === 0 ? score.toString() : score.toFixed(1);
}

export function groupPersonalityTraits(
  allEvaluations: EvaluationData[],
  evaluation: EvaluationData | null
): GroupedTrait[] {
  const evaluationsToUse = allEvaluations.length > 0 ? allEvaluations : (evaluation ? [evaluation] : []);
  if (evaluationsToUse.length === 0) return [];

  const groupMap = new Map<string, GroupedTrait>();
  const traitMap = new Map<string, { trait: EvaluationData["personalityScores"][number]["trait"]; scores: number[] }>();

  evaluationsToUse.forEach((currentEvaluation) => {
    currentEvaluation.personalityScores?.forEach((personalityScore) => {
      if (!personalityScore.trait || !personalityScore.score) {
        return;
      }

      const traitId = personalityScore.trait.id;
      if (!traitMap.has(traitId)) {
        traitMap.set(traitId, { trait: personalityScore.trait, scores: [] });
      }
      traitMap.get(traitId)?.scores.push(personalityScore.score);
    });
  });

  traitMap.forEach(({ trait, scores }) => {
    const group = trait.group;
    const groupId = group?.id || "ungrouped";

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        groupId,
        groupName: group?.name || "No Group",
        groupColor: group?.color || "#6B7280",
        traits: [],
      });
    }

    scores.forEach((score, index) => {
      groupMap.get(groupId)?.traits.push({
        id: `${trait.id}-${index}`,
        name: trait.name,
        score,
        percentage: ((score - 1) / 4) * 100,
      });
    });
  });

  return Array.from(groupMap.values());
}
