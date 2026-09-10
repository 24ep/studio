import type { ComponentType } from "react";

export type IconComponent = ComponentType<{ className?: string }>;

export interface ExpertiseGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  skills: ExpertiseSkill[];
}

export interface ExpertiseSkill {
  id: string;
  name: string;
  description?: string;
  maxScore: number;
  skillType: "hard_skill" | "test_score";
  isActive: boolean;
  sortOrder: number;
  groupId?: string;
  group?: ExpertiseGroup;
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

export interface PersonalityTrait {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  groupId?: string;
  group?: PersonalityGroup;
}

export interface PositionExpertiseSkill {
  id: string;
  positionId: string;
  skillId: string;
  isRequired: boolean;
  weight: number;
  minScore?: number;
  skill: ExpertiseSkill;
}

export interface PositionPersonalityTrait {
  id: string;
  positionId: string;
  traitId: string;
  isRequired: boolean;
  weight: number;
  trait: PersonalityTrait;
}

export interface EvaluationTemplate {
  id: string;
  name: string;
  description?: string;
  templateGroups?: Array<{ id: string; group: { id: string; name: string } }>;
  templateSkills?: Array<{ id: string; skill: { id: string; name: string; groupId?: string } }>;
  templatePersonalityGroups?: Array<{ id: string; group: { id: string; name: string } }>;
  templatePersonalityTraits?: Array<{ id: string; trait: { id: string; name: string; groupId?: string } }>;
}
