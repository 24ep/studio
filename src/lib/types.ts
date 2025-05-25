// This declares the shape of the user object returned by the session callback
// and available in useSession() or getServerSession()
// It needs to be augmented if you add custom properties to the session token
import type { DefaultUser } from 'next-auth';

// Define platform module IDs
export const PLATFORM_MODULES = [
  { id: 'CANDIDATES_VIEW', label: 'View Candidates' },
  { id: 'CANDIDATES_MANAGE', label: 'Manage Candidates (Add, Edit, Delete)' },
  { id: 'POSITIONS_VIEW', label: 'View Positions' },
  { id: 'POSITIONS_MANAGE', label: 'Manage Positions (Add, Edit, Delete)' },
  { id: 'USERS_MANAGE', label: 'Manage Users & Permissions' },
  { id: 'SETTINGS_ACCESS', label: 'Access System Settings' },
  { id: 'LOGS_VIEW', label: 'View Application Logs' },
] as const;

export type PlatformModuleId = typeof PLATFORM_MODULES[number]['id'];


declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: UserProfile['role'];
      modulePermissions?: PlatformModuleId[];
    } & DefaultUser;
  }

  interface User extends DefaultUser {
    role?: UserProfile['role'];
    id: string; // Ensure User object passed to JWT/Session has id
    modulePermissions?: PlatformModuleId[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserProfile['role'];
    modulePermissions?: PlatformModuleId[];
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
  candidateId?: string; // This might not be needed if fetched as part of candidate
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

// For n8n webhook payload
export interface N8NJobMatch {
  job_id: string;
  job_title: string;
  fit_score: number;
  match_reasons: string[];
}

export interface CandidateDetails {
  cv_language?: string;
  personal_info: PersonalInfo;
  contact_info: ContactInfo;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  skills?: SkillEntry[];
  job_suitable?: JobSuitableEntry[];
  associatedMatchDetails?: { // To store details of the top match if candidate is created via n8n
    jobTitle: string;
    fitScore: number;
    reasons: string[];
    n8nJobId?: string; // from n8n's job_id
  };
}

export interface N8NWebhookPayload {
  // Candidate PII - assuming n8n sends this from parsed resume
  name: string; // Derived by n8n or from parsedData.personal_info.firstname + lastname
  email: string; // Derived by n8n or from parsedData.contact_info.email
  phone?: string | null; // Optional, from parsedData.contact_info.phone
  parsedData: CandidateDetails; // The full candidate details from resume parsing

  // Job matching info from n8n
  top_matches?: N8NJobMatch[];
}


// Kept for potential backward compatibility if some candidates have old data structure
export interface OldParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  education?: string[]; // Note: this was string array in old type
  skills?: string[];    // Note: this was string array in old type
  experienceYears?: number;
  summary?: string;
}


export interface Position {
  id: string;
  title: string;
  department: string;
  description?: string | null; // Allow null for description
  isOpen: boolean;
  position_level?: string | null;
  // n8nJobId?: string | null; // Optional: For directly mapping n8n job_id to your positions
  createdAt?: string;
  updatedAt?: string;
  candidates?: Candidate[]; // Relation for ORM/Prisma like fetching
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  resumePath?: string | null;
  // parsedData can be the new detailed structure, old simple structure, or null
  parsedData: CandidateDetails | OldParsedResumeData | null;
  positionId: string | null;
  position?: Position | null; // Relation for ORM/Prisma like fetching
  fitScore: number;
  status: CandidateStatus;
  applicationDate: string; // ISO date string
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
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
  modulePermissions?: PlatformModuleId[]; // Array of allowed module IDs
  createdAt?: string;
  updatedAt?: string;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'AUDIT';

export interface LogEntry {
  id: string;
  timestamp: string; // ISO date string
  level: LogLevel;
  message: string;
  source?: string;
  actingUserId?: string | null; // User ID of the person performing the action
  details?: Record<string, any> | null; // Additional structured data for the log
  createdAt?: string; // ISO date string
}
