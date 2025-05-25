
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Admin' | 'Recruiter' | 'Hiring Manager';
}
