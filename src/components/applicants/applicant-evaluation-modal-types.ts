export type ApplicantEvaluationFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export interface ApplicantEvaluationGroup {
  id: string;
  name: string;
  color: string;
}

export interface ApplicantEvaluationTrait {
  id: string;
  name?: string;
  description?: string;
  group?: ApplicantEvaluationGroup | null;
}

export interface ApplicantPersonalityScore {
  trait: ApplicantEvaluationTrait;
  score: number;
}

export interface ApplicantEvaluationData {
  expertiseScores: unknown[];
  personalityScores: ApplicantPersonalityScore[];
  overallScore: number;
  status: string;
  comments: string;
  evaluator: {
    name: string;
    email: string;
  };
  completedAt: string;
}

export interface AveragedApplicantEvaluationData {
  overallScore: number;
  personalityScores: Array<{
    trait: ApplicantEvaluationTrait;
    averageScore: number;
    evaluatorCount: number;
  }>;
  evaluatorCount: number;
}

export interface ApplicantEvaluationLinkInfo {
  url: string;
  expiresAt: string;
  createdBy?: { id: string; name: string; email: string };
}

export interface ApplicantEvaluationLinkState {
  linkInfo: ApplicantEvaluationLinkInfo;
  requireLogin: boolean;
  expireDays: number;
  existing?: boolean;
}

export interface ApplicantEvaluationPositionValidation {
  hasInterviewers: boolean;
  hasSkills: boolean;
}

export interface ApplicantEvaluationAttachment {
  id?: string;
  fileName?: string;
  originalName?: string;
  name?: string;
  url?: string;
  type?: string;
  filePath?: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number | string;
  [key: string]: unknown;
}
