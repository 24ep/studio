import type {
  EvaluationFormData,
  EvaluationPersonalityGroupConfig,
  EvaluationPersonalityScoreSummary,
  EvaluationQuestion,
  EvaluationSummary,
} from '../types';

export interface PersonalitySkillOverviewItem {
  question: EvaluationQuestion;
  score?: number;
  notes?: string;
  trait?: unknown;
}

export type PersonalitySkillOverviewGroup = [string, PersonalitySkillOverviewItem[]];

function isPersonalityScoreSummary(value: unknown): value is EvaluationPersonalityScoreSummary & { traitId: string } {
  return Boolean(value) && typeof value === 'object' && typeof (value as { traitId?: unknown }).traitId === 'string';
}

function buildPersonalityScoresMap(existingEvaluation: EvaluationSummary) {
  const scoresMap = new Map<string, { score: number; notes: string; trait?: unknown }>();

  if (!Array.isArray(existingEvaluation.personalityScores)) {
    return scoresMap;
  }

  existingEvaluation.personalityScores
    .filter(isPersonalityScoreSummary)
    .forEach((score) => {
      scoresMap.set(score.traitId, {
        score: typeof score.score === 'number' ? score.score : 0,
        notes: score.notes || '',
        trait: score.trait,
      });
    });

  return scoresMap;
}

function getGroupSortConfig(
  groupName: string,
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[]
) {
  return personalityGroupsConfig.find(group => group.name === groupName);
}

function comparePersonalitySkillGroups(
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[]
) {
  return (first: PersonalitySkillOverviewGroup, second: PersonalitySkillOverviewGroup) => {
    const firstGroup = getGroupSortConfig(first[0], personalityGroupsConfig);
    const secondGroup = getGroupSortConfig(second[0], personalityGroupsConfig);

    if (firstGroup && secondGroup) {
      const sortDifference = (firstGroup.sortOrder ?? 0) - (secondGroup.sortOrder ?? 0);
      return sortDifference !== 0 ? sortDifference : first[0].localeCompare(second[0]);
    }

    if (firstGroup) return -1;
    if (secondGroup) return 1;

    return first[0].localeCompare(second[0]);
  };
}

export function buildPersonalitySkillOverviewGroups({
  existingEvaluation,
  formData,
  personalityGroupsConfig,
}: {
  existingEvaluation: EvaluationSummary;
  formData: EvaluationFormData;
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[];
}) {
  const scoresMap = buildPersonalityScoresMap(existingEvaluation);
  const groupedQuestions = new Map<string, PersonalitySkillOverviewItem[]>();

  formData.questions.forEach((question) => {
    const groupName = question.groupName || 'Other';
    const scoreData = scoresMap.get(question.traitId);
    const groupItems = groupedQuestions.get(groupName) ?? [];

    groupItems.push({
      question,
      score: scoreData?.score,
      notes: scoreData?.notes,
      trait: scoreData?.trait,
    });
    groupedQuestions.set(groupName, groupItems);
  });

  return Array.from(groupedQuestions.entries())
    .sort(comparePersonalitySkillGroups(personalityGroupsConfig));
}

export function isPersonalitySkillSelected({
  currentQuestionIndex,
  questions,
  traitId,
  urlTraitId,
}: {
  currentQuestionIndex?: number;
  questions: EvaluationQuestion[];
  traitId: string;
  urlTraitId?: string | null;
}) {
  return questions[currentQuestionIndex ?? -1]?.traitId === traitId || urlTraitId === traitId;
}
