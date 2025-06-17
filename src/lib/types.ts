
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
  { id: 'RECRUITMENT_STAGES_MANAGE', label: 'Manage Recruitment Stages' },
  { id: 'DATA_MODELS_MANAGE', label: 'Manage Data Model Preferences' }, // New permission
  { id: 'WEBHOOK_MAPPING_MANAGE', label: 'Manage Webhook Mappings' }, // New permission
  { id: 'LOGS_VIEW', label: 'View Application Logs' },
] as const;

export type PlatformModuleId = typeof PLATFORM_MODULES[number]['id'];


declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: UserProfile['role'];
      modulePermissions?: PlatformModuleId[];
    } & DefaultUser; // DefaultUser includes name, email, image
  }

  interface User extends DefaultUser { // NextAuth User object
    id: string;
    role?: UserProfile['role'];
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

// Core system statuses - these might still be useful for specific logic,
// but the full list of available stages will come from the RecruitmentStage table.
export type CoreCandidateStatus =
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

// This type will represent any stage name, whether core or custom.
export type CandidateStatus = string;

export interface RecruitmentStage {
  id: string;
  name: string;
  description?: string | null;
  is_system: boolean;
  sort_order?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransitionRecord {
  id: string;
  candidateId?: string;
  date: string;
  stage: CandidateStatus; // Now a string to accommodate custom stages
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
  avatar_url?: string;
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
  is_current_position?: boolean | string; // Allow string for n8n, preprocess in Zod
  postition_level?: string | undefined; // Allow flexible string from n8n
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
  job_id?: string;
  job_title: string;
  fit_score: number;
  match_reasons?: string[];
}

export interface CandidateDetails {
  cv_language?: string;
  personal_info: PersonalInfo;
  contact_info: ContactInfo;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  skills?: SkillEntry[];
  job_suitable?: JobSuitableEntry[];
  associatedMatchDetails?: { // Details of the primary n8n match
    jobTitle: string;
    fitScore: number;
    reasons: string[];
    n8nJobId?: string;
  };
  job_matches?: N8NJobMatch[]; // All job matches from n8n
}

export interface N8NCandidateWebhookEntry {
  candidate_info: CandidateDetails;
  jobs: N8NJobMatch[];
  targetPositionId?: string | null;
  targetPositionTitle?: string | null;
  targetPositionDescription?: string | null;
  targetPositionLevel?: string | null;
  job_applied?: { // Field to capture job applied for specifically
    job_id?: string | null;
    job_title?: string | null;
    fit_score?: number | null;
    match_reasons?: string[];
  } | null;
}

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
  candidates?: Candidate[]; // Relation for dashboard chart
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  resumePath?: string | null;
  parsedData: CandidateDetails | OldParsedResumeData | null;
  positionId: string | null;
  position?: Position | null; // For display, if joined
  fitScore: number;
  status: CandidateStatus; // Now a string to accommodate custom stages
  applicationDate: string;
  recruiterId?: string | null; // New: Assigned recruiter ID
  recruiter?: Pick<UserProfile, 'id' | 'name' | 'email'> | null; // New: Assigned recruiter info
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
  password?: string; // Only used for creation/validation, not sent to client
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
  actingUserName?: string | null; // Added for potential display
  details?: Record<string, any> | null;
  createdAt?: string;
}

// Data Model Attribute Preferences
export type UIDisplayPreference = "Standard" | "Emphasized" | "Hidden";

export interface AttributePreference {
  path: string; // e.g., "Candidate.name", "Position.description"
  uiPreference: UIDisplayPreference;
  customNote: string;
}

export interface DataModelPreferences {
  candidateAttributes: Record<string, Partial<Pick<AttributePreference, 'uiPreference' | 'customNote'>>>;
  positionAttributes: Record<string, Partial<Pick<AttributePreference, 'uiPreference' | 'customNote'>>>;
}

// Webhook Mapping Types
export interface WebhookFieldMapping {
  targetPath: string; // e.g., "personal_info.firstname"
  sourcePath: string; // e.g., "user_profile.general.first_name"
  notes?: string;
}

export interface WebhookMappingConfiguration {
  webhookUrlName: string; // e.g., "Default Candidate Creation Webhook"
  mappings: WebhookFieldMapping[];
}

// Definitions for Data Model Viewer
export interface ModelAttributeDefinition {
  key: string; // The actual key in the data object, e.g., 'name', 'personal_info.firstname'
  label: string; // User-friendly label, e.g., 'Full Name', 'First Name'
  type: string; // e.g., 'string', 'number', 'boolean', 'date', 'object', 'array'
  description?: string;
  subAttributes?: ModelAttributeDefinition[]; // For nested objects
  arrayItemType?: string; // For arrays of simple types or objects
}
