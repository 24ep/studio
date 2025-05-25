
// This declares the shape of the user object returned by the session callback
// and available in useSession() or getServerSession()
// It needs to be augmented if you add custom properties to the session token
import type { DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string; 
      role?: UserProfile['role']; 
    } & DefaultUser; 
  }

  interface User extends DefaultUser {
    role?: UserProfile['role'];
    id: string; // Ensure User object passed to JWT/Session has id
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserProfile['role'];
  }
}


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

export interface PersonalInfo {
  title_honorific?: string;
  firstname: string;
  lastname: string;
  nickname?: string;
  location?: string;
  introduction_aboutme?: string;
}

export interface ContactInfo {
  email: string;
  phone?: string;
}

export interface EducationEntry {
  major?: string;
  field?: string;
  period?: string; 
  duration?: string; 
  GPA?: string;
  university?: string;
  campus?: string;
}

export interface ExperienceEntry {
  company?: string;
  position?: string;
  description?: string;
  period?: string; 
  duration?: string;
  is_current_position?: boolean;
  postition_level?: 'entry level' | 'mid level' | 'senior level' | 'lead' | 'manager' | 'executive';
}

export interface SkillEntry {
  segment_skill?: string;
  skill?: string[]; 
}

export interface JobSuitableEntry {
  suitable_career?: string;
  suitable_job_position?: string;
  suitable_job_level?: string;
  suitable_salary_bath_month?: string; 
}

export interface CandidateDetails {
  cv_language?: string;
  personal_info: PersonalInfo;
  contact_info: ContactInfo;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  skills?: SkillEntry[];
  job_suitable?: JobSuitableEntry[];
}

export interface OldParsedResumeData {
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
  parsedData: CandidateDetails | OldParsedResumeData | null; 
  positionId: string | null;
  position?: Position;
  fitScore: number; 
  status: CandidateStatus;
  applicationDate: string; 
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
  password?: string; // Only used during creation/auth process, not stored in session
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'AUDIT';

export interface LogEntry {
  id: string;
  timestamp: string; 
  level: LogLevel;
  message: string;
  source?: string; 
  actingUserId?: string | null; // User ID of the person performing the action
  details?: Record<string, any> | null; // Additional structured data for the log
  createdAt?: string;
}

