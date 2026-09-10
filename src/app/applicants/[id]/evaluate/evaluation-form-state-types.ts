import type {
  EvaluationApplicantLike,
  EvaluationFormData,
  EvaluationQuestion,
  EvaluationSummary,
  TestingResult,
} from './types';

export interface BuildEvaluationSavePayloadInput {
  applicantPositionId?: string | null;
  evaluatorId?: string | null;
  questions: EvaluationQuestion[];
  testingResults?: TestingResult[] | null;
  overallScore?: number | null;
  comments?: string | null;
  status: 'completed' | 'in_progress';
}

export type ApplicantWithInterviewRemarks = {
  customAttributes?: {
    interviewRemarks?: string | null;
  } | null;
  custom_attributes?: {
    interviewRemarks?: string | null;
  } | null;
} | null | undefined;

export type PersonalityGroupLike = {
  sortOrder?: number | null;
  name?: string | null;
};

export type EvaluationTraitLike = {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  short_description?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
  group?: {
    name?: string | null;
  } | null;
};

export type EvaluationPersonalityGroupAssignment = {
  group?: {
    name?: string | null;
    traits?: EvaluationTraitLike[] | null;
  } | null;
};

export type EvaluationPersonalityTraitAssignment = {
  trait?: EvaluationTraitLike | null;
};

export interface EvaluationCriteriaLike {
  personalityGroups?: EvaluationPersonalityGroupAssignment[] | null;
  personalityTraits?: EvaluationPersonalityTraitAssignment[] | null;
  [key: string]: unknown;
}

export interface BuildEvaluationDataLoadStateInput {
  applicant: EvaluationApplicantLike;
  applicantPositionId: string;
  positionTitle?: string | null;
  evaluationCriteria: EvaluationCriteriaLike;
  existingEvaluationData?: EvaluationSummary[] | EvaluationSummary | null;
  selectedInterviewerId?: string | null;
  idSuffix?: string | number;
}

export interface EvaluationDataLoadState {
  applicantRecruiterId: string | null;
  positionId: string;
  positionTitle: string | null;
  testingResults: TestingResult[];
  existingEvaluation: EvaluationSummary | null;
  evaluationsMap: Map<string, EvaluationSummary> | null;
  formData: EvaluationFormData;
}
