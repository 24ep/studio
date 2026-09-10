export interface PersonalityTrait {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  groupId?: string;
}

export interface PersonalityGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  traits: PersonalityTrait[];
}

export interface PersonalityGroupFormData {
  name: string;
  description: string;
  color: string;
}

export interface PersonalityTraitCreateFormData {
  name: string;
  description: string;
}

export const defaultPersonalityGroupFormData: PersonalityGroupFormData = {
  name: "",
  description: "",
  color: "#10B981",
};

export const defaultPersonalityTraitCreateFormData: PersonalityTraitCreateFormData = {
  name: "",
  description: "",
};
