export interface PersonalityTrait {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  isActive: boolean;
  sortOrder: number;
  groupId?: string;
  group?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface PersonalityGroup {
  id: string;
  name: string;
  color: string;
}

export interface PersonalityTraitFormData {
  name: string;
  description: string;
  shortDescription: string;
  groupId: string;
}

export const defaultPersonalityTraitFormData: PersonalityTraitFormData = {
  name: "",
  description: "",
  shortDescription: "",
  groupId: "",
};
