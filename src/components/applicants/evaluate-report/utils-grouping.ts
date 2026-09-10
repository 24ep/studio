import type {
    AveragedEvaluationData,
    EvaluationGroupConfig,
    GroupedSkill,
    GroupedTrait,
} from './types';

export const formatPersonalityScore = (score: number): string => Math.round(score).toString();

export const groupExpertiseSkills = (
    averagedEvaluationData: AveragedEvaluationData | null,
    personalityGroupsConfig: EvaluationGroupConfig[]
): GroupedSkill[] => {
    if (!averagedEvaluationData?.expertiseScores) return [];

    const groupMap = new Map<string, GroupedSkill>();

    averagedEvaluationData.expertiseScores.forEach(es => {
        const group = es.skill.group;
        const groupId = group?.id || 'ungrouped';
        const groupName = group?.name || 'No Group';
        const groupColor = group?.color || '#6B7280';

        if (!groupMap.has(groupId)) {
            groupMap.set(groupId, {
                groupId,
                groupName,
                groupColor,
                skills: []
            });
        }

        groupMap.get(groupId)!.skills.push({
            id: es.skill.id,
            name: es.skill.name,
            score: es.averageScore,
            maxScore: es.skill.maxScore,
            percentage: (es.averageScore / es.skill.maxScore) * 100
        });
    });

    return sortEvaluationGroups(Array.from(groupMap.values()), personalityGroupsConfig);
};

export const groupPersonalityTraits = (
    averagedEvaluationData: AveragedEvaluationData | null,
    personalityGroupsConfig: EvaluationGroupConfig[]
): GroupedTrait[] => {
    if (!averagedEvaluationData?.personalityScores) return [];

    const groupMap = new Map<string, GroupedTrait>();

    averagedEvaluationData.personalityScores.forEach(ps => {
        const group = ps.trait.group;
        const groupId = group?.id || 'ungrouped';
        const groupName = group?.name || 'No Group';
        const groupColor = group?.color || '#6B7280';

        if (!groupMap.has(groupId)) {
            groupMap.set(groupId, {
                groupId,
                groupName,
                groupColor,
                traits: []
            });
        }

        groupMap.get(groupId)!.traits.push({
            id: ps.trait.id,
            name: ps.trait.name,
            description: ps.trait.description,
            score: ps.averageScore,
            percentage: ((ps.averageScore - 1) / 4) * 100
        });
    });

    return sortEvaluationGroups(Array.from(groupMap.values()), personalityGroupsConfig);
};

export function getExpandedReportGroupIds({
    averagedEvaluationData,
    personalityGroupsConfig,
}: {
    averagedEvaluationData: AveragedEvaluationData | null;
    personalityGroupsConfig: EvaluationGroupConfig[];
}) {
    const allGroupIds = new Set<string>();

    groupExpertiseSkills(averagedEvaluationData, personalityGroupsConfig).forEach(group => {
        allGroupIds.add(group.groupId);
    });

    groupPersonalityTraits(averagedEvaluationData, personalityGroupsConfig).forEach(group => {
        allGroupIds.add(group.groupId);
    });

    return allGroupIds;
}

function sortEvaluationGroups<T extends { groupName: string }>(
    groups: T[],
    personalityGroupsConfig: EvaluationGroupConfig[]
) {
    return groups.sort((a, b) => {
        const aGroup = personalityGroupsConfig.find(group => group.name === a.groupName);
        const bGroup = personalityGroupsConfig.find(group => group.name === b.groupName);

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
