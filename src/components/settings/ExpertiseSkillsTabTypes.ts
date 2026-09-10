export interface ExpertiseSkill {
  id: string;
  name: string;
  description?: string;
  maxScore: number;
  skillType: string;
  isActive: boolean;
  sortOrder: number;
  groupId?: string;
  group?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface ExpertiseGroup {
  id: string;
  name: string;
  color: string;
}

export interface ExpertiseSkillFormData {
  name: string;
  description: string;
  maxScore: number;
  skillType: string;
  groupId: string;
}

export const defaultExpertiseSkillFormData: ExpertiseSkillFormData = {
  name: "",
  description: "",
  maxScore: 100,
  skillType: "hard_skill",
  groupId: "",
};
