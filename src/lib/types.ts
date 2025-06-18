
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
  { id: 'USERS_MANAGE', label: 'Manage Users & Permissions' }, // This permission is for accessing the user management page
  { id: 'USER_GROUPS_MANAGE', label: 'Manage User Groups' },
  { id: 'SYSTEM_SETTINGS_MANAGE', label: 'Manage System-Wide Settings (Name, Logo, Theme)' }, // For server-side app name/logo
  { id: 'USER_PREFERENCES_MANAGE', label: 'Manage Own UI Preferences (Server-Side)' }, // For server-side data model prefs
  { id: 'RECRUITMENT_STAGES_MANAGE', label: 'Manage Recruitment Stages' },
  { id: 'DATA_MODELS_MANAGE', label: 'Manage Data Model Preferences (Client)' }, // This might become deprecated if fully server-side
  { id: 'CUSTOM_FIELDS_MANAGE', label: 'Manage Custom Field Definitions (Server)' },
  { id: 'WEBHOOK_MAPPING_MANAGE', label: 'Manage Webhook Mappings' },
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
  postition_level?: string | null | undefined;
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
  job_title?: string | null;
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
  associatedMatchDetails?: { 
    jobTitle: string;
    fitScore: number;
    reasons: string[];
    n8nJobId?: string;
  };
  job_matches?: N8NJobMatch[]; 
}

export interface N8NCandidateWebhookEntry {
  candidate_info: CandidateDetails;
  jobs?: N8NJobMatch[];
  targetPositionId?: string | null;
  targetPositionTitle?: string | null;
  targetPositionDescription?: string | null;
  targetPositionLevel?: string | null;
  job_applied?: {
    job_id?: string | null;
    job_title?: string | null;
    fit_score?: number | null;
    justification?: string[];
  } | null;
}

export type N8NWebhookPayload = N8NCandidateWebhookEntry;

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
  custom_attributes?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
  candidates?: Candidate[];
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string | null;
  permissions?: PlatformModuleId[]; // Added to hold permissions for a group
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null; // For candidate profile image
  dataAiHint?: string | null; // For candidate profile image
  resumePath?: string | null; // Current/primary resume
  parsedData: CandidateDetails | OldParsedResumeData | null;
  positionId: string | null;
  position?: Position | null;
  fitScore: number;
  status: CandidateStatus;
  applicationDate: string;
  recruiterId?: string | null;
  recruiter?: Pick<UserProfile, 'id' | 'name' | 'email'> | null;
  custom_attributes?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
  transitionHistory: TransitionRecord[];
}

export interface ResumeHistoryEntry {
  id: string;
  candidateId: string;
  filePath: string;
  originalFileName: string;
  uploadedAt: string;
  uploadedByUserId?: string | null;
  uploadedByUserName?: string | null; // For display
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
  groups?: UserGroup[];
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
  actingUserName?: string | null;
  details?: Record<string, any> | null;
  createdAt?: string;
}

export type UIDisplayPreference = "Standard" | "Emphasized" | "Hidden";

export interface AttributePreference {
  path: string;
  uiPreference: UIDisplayPreference;
  customNote: string;
}

export interface UserDataModelPreference {
  id?: string; // DB id
  userId: string;
  modelType: 'Candidate' | 'Position'; // Which model this preference is for
  attributeKey: string; // e.g., 'name', 'parsedData.personal_info.location'
  uiPreference: UIDisplayPreference;
  customNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DataModelPreferences { // Used on client-side, potentially loaded from server
  candidateAttributes: Record<string, Partial<Pick<UserDataModelPreference, 'uiPreference' | 'customNote'>>>;
  positionAttributes: Record<string, Partial<Pick<UserDataModelPreference, 'uiPreference' | 'customNote'>>>;
}


export interface WebhookFieldMapping {
  id?: string;
  targetPath: string;
  sourcePath: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModelAttributeDefinition {
  key: string;
  label: string;
  type: string;
  description?: string;
  subAttributes?: ModelAttributeDefinition[];
  arrayItemType?: string;
}

export type CustomFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select_single' | 'select_multiple';
export const CUSTOM_FIELD_TYPES: CustomFieldType[] = ['text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple'];

export interface CustomFieldOption {
  value: string;
  label: string;
}
export interface CustomFieldDefinition {
  id: string;
  model_name: 'Candidate' | 'Position';
  field_key: string;
  label: string;
  field_type: CustomFieldType;
  options?: CustomFieldOption[] | null;
  is_required?: boolean;
  sort_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

// System-wide settings
export interface SystemSetting {
    key: 'appName' | 'appLogoDataUrl' | 'appThemePreference'; // Add more keys as needed
    value: string | null; // Store theme preference as string e.g. "dark", "light", "system"
    updatedAt?: string;
}
