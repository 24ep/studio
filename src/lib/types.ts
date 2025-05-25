
// This declares the shape of the user object returned by the session callback
// and available in useSession() or getServerSession()
// It needs to be augmented if you add custom properties to the session token
import type { DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // Add id here
      role?: UserProfile['role']; // Add role here
    } & DefaultUser; // Keep existing fields like name, email, image
  }

  // Optional: If you're augmenting the User object returned by the authorize function
  // or the profile function of an OAuth provider.
  interface User extends DefaultUser {
    role?: UserProfile['role'];
  }
}

// JWT token can also be augmented if needed
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

// New detailed types for candidate information
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
  period?: string; // e.g., "2018-2022" or "Aug 2018 - May 2022"
  duration?: string; // e.g., "4y" or "3y5m"
  GPA?: string;
  university?: string;
  campus?: string;
}

export interface ExperienceEntry {
  company?: string;
  position?: string;
  description?: string;
  period?: string; // e.g., "2022-Present" or "Jan 2022 - Dec 2023"
  duration?: string;
  is_current_position?: boolean;
  postition_level?: 'entry level' | 'mid level' | 'senior level' | 'lead' | 'manager' | 'executive';
}

export interface SkillEntry {
  segment_skill?: string;
  skill?: string[]; // Representing the list like ["excel", "photoshop"]
}

export interface JobSuitableEntry {
  suitable_career?: string;
  suitable_job_position?: string;
  suitable_job_level?: string;
  suitable_salary_bath_month?: string; // Assuming this is a string, can be number if defined
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

// Original ParsedResumeData - might be deprecated or co-exist if some systems produce simpler output
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
  name: string; // Will be derived from personal_info.firstname + personal_info.lastname
  email: string; // Will be derived from contact_info.email
  phone?: string; // Will be derived from contact_info.phone
  resumePath?: string;
  parsedData: CandidateDetails | OldParsedResumeData | null; // Updated to include new detailed structure
  positionId: string | null;
  position?: Position;
  fitScore: number; // 0-100
  status: CandidateStatus;
  applicationDate: string; // ISO date string
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
  // password?: string; // Password should NOT be part of this type if it's for client-side/API responses
}

// LogEntry type
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  level: LogLevel;
  message: string;
  source?: string; // e.g., 'API', 'Frontend', 'System'
  createdAt?: string;
}
