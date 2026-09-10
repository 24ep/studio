export interface SkillTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  templateGroups: Array<{
    id: string;
    group: ExpertiseGroup;
  }>;
  templateSkills: Array<{
    id: string;
    skill: ExpertiseSkill;
  }>;
  templatePersonalityGroups: Array<{
    id: string;
    group: PersonalityGroup;
  }>;
  templatePersonalityTraits: Array<{
    id: string;
    trait: PersonalityTrait;
  }>;
}

export interface ExpertiseGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
}

export interface ExpertiseSkill {
  id: string;
  name: string;
  description?: string;
  skillType: string;
  isActive: boolean;
  groupId?: string;
}

export interface PersonalityGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
}

export interface PersonalityTrait {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  groupId?: string;
}

export interface SkillTemplateFormData {
  name: string;
  description: string;
  groupIds: string[];
  skillIds: string[];
  personalityGroupIds: string[];
  personalityTraitIds: string[];
}

export function buildEmptySkillTemplateFormData(): SkillTemplateFormData {
  return {
    name: '',
    description: '',
    groupIds: [],
    skillIds: [],
    personalityGroupIds: [],
    personalityTraitIds: [],
  };
}

export function buildSkillTemplateFormData(template: SkillTemplate): SkillTemplateFormData {
  return {
    name: template.name,
    description: template.description || '',
    groupIds: template.templateGroups.map(templateGroup => templateGroup.group.id),
    skillIds: template.templateSkills.map(templateSkill => templateSkill.skill.id),
    personalityGroupIds: template.templatePersonalityGroups?.map(templateGroup => templateGroup.group.id) || [],
    personalityTraitIds: template.templatePersonalityTraits?.map(templateTrait => templateTrait.trait.id) || [],
  };
}

export function toggleExpertiseGroupSelection(
  formData: SkillTemplateFormData,
  groupId: string,
  skills: ExpertiseSkill[]
): SkillTemplateFormData {
  const groupSkills = skills.filter(skill => skill.groupId === groupId);
  const isGroupSelected = formData.groupIds.includes(groupId);

  return {
    ...formData,
    groupIds: isGroupSelected
      ? formData.groupIds.filter(id => id !== groupId)
      : [...formData.groupIds, groupId],
    skillIds: isGroupSelected
      ? formData.skillIds.filter(id => !groupSkills.some(skill => skill.id === id))
      : [...formData.skillIds, ...groupSkills.map(skill => skill.id)],
  };
}

export function togglePersonalityGroupSelection(
  formData: SkillTemplateFormData,
  groupId: string,
  traits: PersonalityTrait[]
): SkillTemplateFormData {
  const groupTraits = traits.filter(trait => trait.groupId === groupId);
  const isGroupSelected = formData.personalityGroupIds.includes(groupId);

  return {
    ...formData,
    personalityGroupIds: isGroupSelected
      ? formData.personalityGroupIds.filter(id => id !== groupId)
      : [...formData.personalityGroupIds, groupId],
    personalityTraitIds: isGroupSelected
      ? formData.personalityTraitIds.filter(id => !groupTraits.some(trait => trait.id === id))
      : [...formData.personalityTraitIds, ...groupTraits.map(trait => trait.id)],
  };
}

export function toggleIdSelection(selectedIds: string[], id: string) {
  return selectedIds.includes(id)
    ? selectedIds.filter(selectedId => selectedId !== id)
    : [...selectedIds, id];
}

export function selectAllUngroupedIds<T extends { id: string; groupId?: string }>(
  existingIds: string[],
  items: T[]
) {
  const ungroupedIds = items.filter(item => !item.groupId).map(item => item.id);
  return [...existingIds, ...ungroupedIds.filter(id => !existingIds.includes(id))];
}

export function getSelectedNames<T extends { id: string; name: string }>(items: T[], selectedIds: string[]) {
  return items
    .filter(item => selectedIds.includes(item.id))
    .map(item => item.name);
}
