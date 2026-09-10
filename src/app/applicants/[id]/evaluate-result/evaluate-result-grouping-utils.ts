import type { AveragedEvaluationData, GroupedSkill, GroupedTrait } from './types';

const UNGROUPED_ID = 'ungrouped';
const UNGROUPED_NAME = 'No Group';
const UNGROUPED_COLOR = '#6B7280';

export type GroupConfig = {
  name?: string;
  sortOrder?: number;
};

function sortGroupsByConfig<T extends { groupName: string }>(
  groups: T[],
  groupsConfig: GroupConfig[],
): T[] {
  return groups.sort((a, b) => {
    const aGroup = groupsConfig.find(group => group.name === a.groupName);
    const bGroup = groupsConfig.find(group => group.name === b.groupName);

    if (aGroup && bGroup) {
      if (aGroup.sortOrder !== bGroup.sortOrder) {
        return (aGroup.sortOrder ?? 0) - (bGroup.sortOrder ?? 0);
      }
      return a.groupName.localeCompare(b.groupName);
    }

    if (aGroup) return -1;
    if (bGroup) return 1;

    return a.groupName.localeCompare(b.groupName);
  });
}

function getGroupIdentity(group?: { id?: string; name?: string; color?: string } | null) {
  return {
    groupId: group?.id || UNGROUPED_ID,
    groupName: group?.name || UNGROUPED_NAME,
    groupColor: group?.color || UNGROUPED_COLOR,
  };
}

export function groupExpertiseSkills(
  averagedEvaluationData: AveragedEvaluationData | null,
  personalityGroupsConfig: GroupConfig[] = [],
): GroupedSkill[] {
  if (!averagedEvaluationData?.expertiseScores) return [];

  const groupMap = new Map<string, GroupedSkill>();

  averagedEvaluationData.expertiseScores.forEach(expertiseScore => {
    const group = getGroupIdentity(expertiseScore.skill.group);

    if (!groupMap.has(group.groupId)) {
      groupMap.set(group.groupId, {
        ...group,
        skills: [],
      });
    }

    const maxScore = expertiseScore.skill.maxScore ?? 0;
    const percentage = maxScore > 0 ? (expertiseScore.averageScore / maxScore) * 100 : 0;
    groupMap.get(group.groupId)!.skills.push({
      id: expertiseScore.skill.id,
      name: expertiseScore.skill.name || 'Unnamed Skill',
      score: expertiseScore.averageScore,
      maxScore,
      percentage,
    });
  });

  return sortGroupsByConfig(Array.from(groupMap.values()), personalityGroupsConfig);
}

export function groupPersonalityTraits(
  averagedEvaluationData: AveragedEvaluationData | null,
  personalityGroupsConfig: GroupConfig[] = [],
): GroupedTrait[] {
  if (!averagedEvaluationData?.personalityScores) return [];

  const groupMap = new Map<string, GroupedTrait>();

  averagedEvaluationData.personalityScores.forEach(personalityScore => {
    const group = getGroupIdentity(personalityScore.trait.group);

    if (!groupMap.has(group.groupId)) {
      groupMap.set(group.groupId, {
        ...group,
        traits: [],
      });
    }

    const percentage = ((personalityScore.averageScore - 1) / 4) * 100;
    groupMap.get(group.groupId)!.traits.push({
      id: personalityScore.trait.id,
      name: personalityScore.trait.name || 'Unnamed Trait',
      description: personalityScore.trait.description,
      score: personalityScore.averageScore,
      percentage,
    });
  });

  return sortGroupsByConfig(Array.from(groupMap.values()), personalityGroupsConfig);
}
