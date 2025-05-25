
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
  candidateId?: string; 
  date: string; // ISO date string
  stage: CandidateStatus;
  notes?: string;
  createdAt?: string; 
  updatedAt?: string; 
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

export interface Position {
  id: string;
  title: string;
  department: string;
  description?: string;
  isOpen: boolean;
  createdAt?: string; 
  updatedAt?: string; 
  candidates?: Candidate[]; 
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumePath?: string; 
  parsedData: ParsedResumeData | null; // Can be null if not parsed
  positionId: string | null; // Can be null if not assigned to a position
  position?: Position; 
  fitScore: number; // 0-100
  status: CandidateStatus;
  applicationDate: string; // ISO date string
  lastUpdateDate?: string; // // Kept for compatibility, but updatedAt is primary for DB
  createdAt?: string; 
  updatedAt?: string; 
  transitionHistory: TransitionRecord[];
}


export interface UserProfile { 
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  dataAiHint?: string; 
  role: 'Admin' | 'Recruiter' | 'Hiring Manager';
}

// New LogEntry type
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  level: LogLevel;
  message: string;
  source?: string; // e.g., 'API', 'Frontend', 'System'
  createdAt?: string;
}
