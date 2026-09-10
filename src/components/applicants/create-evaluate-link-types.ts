export interface CreateEvaluateLinkApplicantInfo {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  positionId?: string | null;
  position?: { id: string; title: string } | null;
}

export interface Interviewer {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  positionTitle?: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  positionTitle?: string;
}

export interface AzureMeetingRoom {
  id: string;
  displayName: string;
  capacity: number | null;
  building: string | null;
  emailAddress?: string;
}

export type CreateEvaluateLinkStep = 'configure' | 'email' | 'success';

export interface CreateEvaluateLinkInitialData {
  interviewDateTime?: string;
  interviewLocation?: string;
  interviewers?: Array<{ id: string; name: string }>;
}

export interface CreateEvaluateLinkModalResetState {
  currentStep: CreateEvaluateLinkStep;
  interviewDate: Date | undefined;
  interviewTime: string;
  duration: number;
  location: string;
  locationEmail: string | undefined;
  selectedInterviewerIds: Set<string>;
  emailSubject: string;
  emailBody: string;
  linkInfo: { url: string; expiresAt: string } | null;
  expireDays: number;
  requireLogin: boolean;
  sendEmail: boolean;
  copied: boolean;
  addInterviewerOpen: boolean;
  selectedUserIds: Set<string>;
  isCustomLocation: boolean;
}

export interface CreateEvaluateLinkNextAction {
  nextStep?: CreateEvaluateLinkStep;
  shouldCreateLink: boolean;
  skipEmail: boolean;
}
