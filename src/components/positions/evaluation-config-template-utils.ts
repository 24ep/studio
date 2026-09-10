import type {
  EvaluationPreviewGroupLike,
  EvaluationTemplateLike,
  EvaluationTemplatePreviewAssignment,
  EvaluationTemplatePreviewSection,
  PositionSkillLike,
  PositionTraitLike,
} from './evaluation-config-types';

export function isEvaluationTemplateFullyApplied(
  template: EvaluationTemplateLike | null | undefined,
  positionSkills: PositionSkillLike[],
  positionTraits: PositionTraitLike[]
) {
  if (!template) return false;

  const { skillIds, traitIds } = getEvaluationTemplateIds(template);

  const hasAllSkills = skillIds.every(id => positionSkills.some(positionSkill => positionSkill.skillId === id));
  const hasAllTraits = traitIds.every(id => positionTraits.some(positionTrait => positionTrait.traitId === id));

  return hasAllSkills && hasAllTraits;
}

export function getEvaluationTemplateIds(template: EvaluationTemplateLike | null | undefined) {
  return {
    groupIds: (template?.templateGroups || []).map(templateGroup => templateGroup.group.id),
    skillIds: (template?.templateSkills || []).map(templateSkill => templateSkill.skill.id),
    personalityGroupIds: (template?.templatePersonalityGroups || []).map(templateGroup => templateGroup.group.id),
    traitIds: (template?.templatePersonalityTraits || []).map(templateTrait => templateTrait.trait.id),
  };
}

export function buildEvaluationTemplatePreviewSections<TItem extends { id: string; name: string; groupId?: string }>(
  groups: EvaluationPreviewGroupLike[],
  assignments: Array<EvaluationTemplatePreviewAssignment<TItem>> | null | undefined,
  ungroupedName: string
): Array<EvaluationTemplatePreviewSection<TItem>> {
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const assignmentsWithItems = safeAssignments.filter((assignment): assignment is { id: string; item: TItem } => Boolean(assignment.item));
  const knownGroupIds = new Set(groups.map(group => group.id));

  const groupedSections = groups
    .map(group => ({
      id: group.id,
      name: group.name,
      color: group.color,
      items: assignmentsWithItems.filter(assignment => assignment.item.groupId === group.id),
    }))
    .filter(section => section.items.length > 0);

  const ungroupedItems = assignmentsWithItems.filter(assignment => (
    !assignment.item.groupId || !knownGroupIds.has(assignment.item.groupId)
  ));

  if (ungroupedItems.length === 0) {
    return groupedSections;
  }

  return [
    ...groupedSections,
    {
      id: 'ungrouped',
      name: ungroupedName,
      items: ungroupedItems,
      isUngrouped: true,
    },
  ];
}
