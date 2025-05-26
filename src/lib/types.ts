
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
  candidateId?: string; 
  date: string; 
  stage: CandidateStatus;
  notes?: string;
  actingUserId?: string | null;
  actingUserName?: string | null; // For display purposes, populated by JOIN
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
  avatar_url?: string; // Added for potential future use from parsed data
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

export type PositionLevel = 
  | 'entry level' 
  | 'mid level' 
  | 'senior level' 
  | 'lead' 
  | 'manager' 
  | 'executive'
  | 'officer'
  | 'leader';

export interface ExperienceEntry {
  company?: string;
  position?: string;
  description?: string;
  period?: string;
  duration?: string;
  is_current_position?: boolean | string; // Allow string due to n8n payload
  postition_level?: PositionLevel | string; // Allow string due to n8n payload
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

export interface N8NJobMatch {
  job_id?: string; // Made optional as per your last n8n example
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
  associatedMatchDetails?: { 
    jobTitle: string;
    fitScore: number;
    reasons: string[];
    n8nJobId?: string; 
  };
}

// For the n8n webhook that creates candidates
export interface N8NCandidateInfoForWebhook {
  cv_language?: string;
  personal_info: PersonalInfo;
  contact_info: ContactInfo;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  skills?: SkillEntry[];
  job_suitable?: JobSuitableEntry[];
}
export interface N8NCandidateWebhookEntry {
  candidate_info: N8NCandidateInfoForWebhook; // This used to be CandidateDetails
  jobs: N8NJobMatch[];
}
// The overall payload from n8n is now a single object not an array
export type N8NWebhookPayload = N8NCandidateWebhookEntry;


// Kept for potential backward compatibility if some candidates have old data structure
export interface OldParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  education?: string[]; 
  skills?: string[];    
  experienceYears?: number;
  summary?: string;
}


export interface Position {
  id: string;
  title: string;
  department: string;
  description?: string | null; 
  isOpen: boolean;
  position_level?: string | null; 
  createdAt?: string;
  updatedAt?: string;
  candidates?: Candidate[]; 
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  resumePath?: string | null;
  parsedData: CandidateDetails | OldParsedResumeData | null;
  positionId: string | null;
  position?: Position | null; 
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
  password?: string; 
  modulePermissions?: PlatformModuleId[]; 
  createdAt?: string;
  updatedAt?: string;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'AUDIT';

export interface LogEntry {
  id: string;
  timestamp: string; 
  level: LogLevel;
  message: string;
  source?: string;
  actingUserId?: string | null; 
  details?: Record<string, any> | null; 
  createdAt?: string; 
}
