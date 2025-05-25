
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
  candidateId?: string; // Added if you want to query transitions separately, Prisma relation handles it
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

export interface Position {
  id: string;
  title: string;
  department: string;
  description?: string;
  isOpen: boolean;
  createdAt?: string; // Prisma adds these
  updatedAt?: string; // Prisma adds these
  candidates?: Candidate[]; // Relation: A position can have many candidates
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumePath?: string; // Path to the resume in MinIO
  parsedData: ParsedResumeData; // Stored as JSON in DB
  positionId: string;
  position?: Position; // Relation: A candidate belongs to a position
  fitScore: number; // 0-100
  status: CandidateStatus;
  applicationDate: string; // ISO date string
  lastUpdateDate: string; // ISO date string
  createdAt?: string; // Prisma adds these
  updatedAt?: string; // Prisma adds these
  transitionHistory: TransitionRecord[];
}


export interface UserProfile { // Represents an application user (recruiter, admin)
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  dataAiHint?: string; // For placeholder images if avatarUrl is missing
  role: 'Admin' | 'Recruiter' | 'Hiring Manager';
}
