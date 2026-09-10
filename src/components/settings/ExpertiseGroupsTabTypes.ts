export interface ExpertiseSkill {
  id: string;
  name: string;
  description?: string;
  maxScore: number;
  skillType: string;
  isActive: boolean;
  sortOrder: number;
  groupId?: string;
}

export interface ExpertiseGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  skills: ExpertiseSkill[];
}

export interface ExpertiseGroupFormData {
  name: string;
  description: string;
  color: string;
}

export interface ExpertiseSkillCreateFormData {
  name: string;
  description: string;
  maxScore: number;
  skillType: string;
}

export const defaultExpertiseGroupFormData: ExpertiseGroupFormData = {
  name: "",
  description: "",
  color: "#3B82F6",
};

export const defaultExpertiseSkillCreateFormData: ExpertiseSkillCreateFormData = {
  name: "",
  description: "",
  maxScore: 100,
  skillType: "hard_skill",
};
