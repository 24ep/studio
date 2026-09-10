export interface ApplicantWithEvaluationLink {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  position?: { id: string; title: string } | null;
  evaluationLink: {
    url: string;
    expiresAt: string;
    revokedAt?: string | null;
    interviewDateTime?: string;
    interviewLocation?: string;
    interviewers?: Array<{ id: string; name: string }>;
  };
}

export interface SearchApplicant {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  position?: { id: string; title: string } | null;
  positionId?: string | null;
}

export interface PositionValidation {
  hasInterviewers: boolean;
  hasSkills: boolean;
  positionId: string | null;
  positionTitle: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ApplicantReminder {
  id: string;
  applicantId: string;
  title: string;
  content: string | null;
  reminderDate: string;
  isCompleted: boolean;
  applicant: {
    id: string;
    name: string;
    position?: { title: string } | null;
  };
}

export interface CalendarInterviewer {
  id: string;
  name: string;
  email?: string;
}

export interface CalendarEvaluationQrData {
  name: string;
  url: string;
  avatarUrl: string | null;
  expiresAt: string;
}

export interface CreatedEvaluationLinkPayload {
  url?: unknown;
  expiresAt?: unknown;
}

export interface EvaluationLinkPayloadItem {
  applicant?: {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    avatarUrl?: unknown;
    position?: { id: string; title: string } | null;
  } | null;
  url?: unknown;
  expiresAt?: unknown;
  revokedAt?: unknown;
  interviewDateTime?: unknown;
  interviewLocation?: unknown;
  interviewers?: Array<{ id: string; name: string }>;
}

export interface SearchApplicantPayload {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  avatarUrl?: unknown;
  position?: { id: string; title: string } | null;
  positionId?: unknown;
}

export interface InterviewerPayload {
  id?: unknown;
  name?: unknown;
  email?: unknown;
}
