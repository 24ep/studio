
export type CandidateStatus =
  | 'Applied'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interviewing'
  | 'Offer Extended'
  | 'Offer Accepted'
  | 'Hired'
  | 'Rejected'
  | 'On Hold';

export interface TransitionRecord {
  id: string;
  date: string; // ISO date string
  stage: CandidateStatus;
  notes?: string;
}

export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  education: string[];
  skills: string[];
  experienceYears?: number;
  summary?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string; // URL to the stored resume
  parsedData: ParsedResumeData;
  positionId: string;
  positionTitle: string;
  fitScore: number; // 0-100
  status: CandidateStatus;
  applicationDate: string; // ISO date string
  lastUpdateDate: string; // ISO date string
  transitionHistory: TransitionRecord[];
}

export interface Position {
  id: string;
  title: string;
  department: string;
  description?: string;
  isOpen: boolean;
}

export interface UserProfile { // Represents an application user (recruiter, admin)
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  dataAiHint?: string; // For placeholder images if avatarUrl is missing
  role: 'Admin' | 'Recruiter' | 'Hiring Manager';
}
