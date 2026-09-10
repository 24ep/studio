import type { Applicant, Position } from '@/lib/types';

export interface EvaluationQuestion {
  id: string;
  traitId: string;
  traitName: string;
  groupName: string;
  description: string;
  shortDescription?: string;
  score: number;
  notes: string;
}

export interface EvaluationFormData {
  applicant: Applicant;
  position?: Position;
  questions: EvaluationQuestion[];
  currentQuestionIndex: number;
  overallScore: number;
  comments: string;
}

export interface EvaluationPersonalityGroupConfig {
  id?: string;
  name?: string | null;
  sortOrder?: number | null;
}

export interface Interviewer {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  avatarUrl?: string | null;
  positionTitle?: string;
}

export interface TestingResult {
  id: string;
  assignmentId?: string; // Assignment ID for deletion
  groupAssignmentId?: string; // Assignment ID for deletion of entire group
  groupName?: string; // Name of the group for confirmation message
  label: string;
  score: number;
  maxScore: number;
}

export interface EvaluationAttachment {
  id?: string;
  fileName?: string;
  filename?: string;
  name?: string;
  originalName?: string;
  filePath?: string;
  url?: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number | string;
  mimeType?: string;
  fileType?: string;
  size?: number;
  [key: string]: unknown;
}

export interface EvaluationAttachmentPreview {
  fileName: string;
  url: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number | string;
  filePath?: string;
  applicantId?: string;
}

export interface EvaluationPersonalityScoreSummary {
  traitId?: string | null;
  score?: number | null;
  notes?: string | null;
  trait?: unknown;
}

export interface EvaluationExpertiseScoreSummary {
  skillId?: string | null;
  score?: number | null;
  notes?: string | null;
}

export interface EvaluationSummary {
  id?: string;
  evaluator?: {
    id?: string | null;
  } | null;
  status?: string | null;
  overallScore?: number | null;
  personalityScores?: unknown[] | null;
  expertiseScores?: unknown[] | null;
  comments?: string | null;
  createdAt?: string | null;
}

export type EvaluationApplicantLike = {
  id?: string;
  name?: string;
  email?: string;
  recruiterId?: string | null;
  positionId?: string | null;
  positionTitle?: string | null;
  assignmentJustification?: string | readonly unknown[] | null;
  aiEvaluation?: string | readonly unknown[] | null;
  parsedData?: unknown;
  position?: {
    id?: string;
    title?: string;
    department?: string;
    isOpen?: boolean;
  } | null;
  customAttributes?: {
    interviewRemarks?: string | null;
  } | null;
  custom_attributes?: {
    interviewRemarks?: string | null;
  } | null;
};

