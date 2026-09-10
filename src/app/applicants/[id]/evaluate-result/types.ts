export interface EvaluationData {
  expertiseScores: ExpertiseScore[];
  personalityScores: PersonalityScore[];
  overallScore: number;
  status: string;
  comments: string;
  evaluator: {
    name: string;
    email: string;
  };
  completedAt: string;
}

export interface EvaluationGroup {
  id: string;
  name: string;
  color: string;
}

export interface EvaluationTrait {
  id: string;
  name?: string;
  description?: string;
  group?: EvaluationGroup | null;
}

export interface EvaluationSkill {
  id: string;
  name?: string;
  maxScore?: number;
  group?: EvaluationGroup | null;
}

export interface PersonalityScore {
  trait: EvaluationTrait;
  score: number;
}

export interface ExpertiseScore {
  skill: EvaluationSkill;
  score: number;
}

export interface EvaluationRecord {
  id?: string;
  overallScore?: number | null;
  status?: string | null;
  comments?: string | null;
  completedAt?: string | null;
  evaluator?: {
    id?: string;
    name?: string;
    email?: string;
    avatarUrl?: string | null;
    image?: string | null;
    positionTitle?: string | null;
  } | null;
  position?: {
    title?: string | null;
  } | null;
  personalityScores?: PersonalityScore[];
  expertiseScores?: ExpertiseScore[];
}

export interface AveragedEvaluationData {
  overallScore: number;
  personalityScores: Array<{
    trait: EvaluationTrait;
    averageScore: number;
    evaluatorCount: number;
  }>;
  evaluatorCount: number;
  expertiseScores?: Array<{
    skill: EvaluationSkill;
    averageScore: number;
    evaluatorCount: number;
  }>;
}

export interface GroupedTrait {
  groupId: string;
  groupName: string;
  groupColor: string;
  traits: Array<{
    id: string;
    name: string;
    description?: string;
    score: number;
    percentage: number;
  }>;
}

export interface GroupedSkill {
  groupId: string;
  groupName: string;
  groupColor: string;
  skills: Array<{
    id: string;
    name: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>;
}

