// This declares the shape of the user object returned by the session callback
// and available in useSession() or getServerSession()
// It needs to be augmented if you add custom properties to the session token
import type { DefaultUser } from 'next-auth';

// Define platform module IDs with categories
export const PLATFORM_MODULE_CATEGORIES = {
  CANDIDATE_MANAGEMENT: "Candidate Management",
  POSITION_MANAGEMENT: "Position Management",
  USER_ACCESS_CONTROL: "User Access Control",
  SYSTEM_CONFIGURATION: "System Configuration",
  LOGGING_AUDIT: "Logging & Audit",
  DEPARTMENT_MANAGEMENT: "Department Management",
} as const;

export type PlatformModuleCategory = typeof PLATFORM_MODULE_CATEGORIES[keyof typeof PLATFORM_MODULE_CATEGORIES];

export const PLATFORM_MODULES = [
  { id: 'CANDIDATES_VIEW', label: 'View Candidates', category: PLATFORM_MODULE_CATEGORIES.CANDIDATE_MANAGEMENT, description: "Allows viewing candidate profiles and lists." },
  { id: 'CANDIDATES_MANAGE', label: 'Manage Candidates', category: PLATFORM_MODULE_CATEGORIES.CANDIDATE_MANAGEMENT, description: "Allows adding, editing, and deleting candidate profiles." },
  { id: 'CANDIDATES_IMPORT', label: 'Import Candidates', category: PLATFORM_MODULE_CATEGORIES.CANDIDATE_MANAGEMENT, description: "Allows bulk importing of candidate data." },
  { id: 'CANDIDATES_EXPORT', label: 'Export Candidates', category: PLATFORM_MODULE_CATEGORIES.CANDIDATE_MANAGEMENT, description: "Allows bulk exporting of candidate data." },
  { id: 'POSITIONS_VIEW', label: 'View Positions', category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT, description: "Allows viewing job position details and lists." },
  { id: 'POSITIONS_MANAGE', label: 'Manage Positions', category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT, description: "Allows adding, editing, and deleting job positions." },
  { id: 'POSITIONS_IMPORT', label: 'Import Positions', category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT, description: "Allows bulk importing of position data." },
  { id: 'POSITIONS_EXPORT', label: 'Export Positions', category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT, description: "Allows bulk exporting of position data." },
  { id: 'USERS_MANAGE', label: 'Manage Users', category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL, description: "Allows managing user accounts and their direct permissions (typically Admin only)." },
  { id: 'USER_GROUPS_MANAGE', label: 'Manage Roles (Groups)', category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL, description: "Allows managing user groups (roles) and their assigned permissions." },
  { id: 'SYSTEM_SETTINGS_MANAGE', label: 'Manage System Preferences', category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION, description: "Allows managing global system settings like App Name, Logo, SMTP." },
  { id: 'USER_PREFERENCES_MANAGE', label: 'Manage Own UI Preferences', category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION, description: "Allows users to manage their own UI display preferences for data models." },
  { id: 'RECRUITMENT_STAGES_MANAGE', label: 'Manage Recruitment Stages', category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION, description: "Allows managing the stages in the recruitment pipeline." },
  { id: 'CUSTOM_FIELDS_MANAGE', label: 'Manage Custom Fields', category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION, description: "Allows defining custom data fields for candidates and positions." },
  { id: 'WEBHOOK_MAPPING_MANAGE', label: 'Manage Webhook Mappings', category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION, description: "Allows configuring mappings for incoming webhook payloads." },
  { id: 'NOTIFICATION_SETTINGS_MANAGE', label: 'Manage Notification Settings', category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION, description: "Allows configuring system notification events and channels." },
  { id: 'LOGS_VIEW', label: 'View Application Logs', category: PLATFORM_MODULE_CATEGORIES.LOGGING_AUDIT, description: "Allows viewing system and audit logs." },
  { id: 'HR_MANAGE', label: 'Manage HR Department', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows managing users and settings for the HR department." },
  { id: 'HR_CREATE', label: 'Create HR Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows creating HR records." },
  { id: 'HR_UPDATE', label: 'Update HR Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows updating HR records." },
  { id: 'HR_DELETE', label: 'Delete HR Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows deleting HR records." },
  { id: 'IT_MANAGE', label: 'Manage IT Department', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows managing users and settings for the IT department." },
  { id: 'IT_CREATE', label: 'Create IT Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows creating IT records." },
  { id: 'IT_UPDATE', label: 'Update IT Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows updating IT records." },
  { id: 'IT_DELETE', label: 'Delete IT Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows deleting IT records." },
  { id: 'FINANCE_MANAGE', label: 'Manage Finance Department', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows managing users and settings for the Finance department." },
  { id: 'FINANCE_CREATE', label: 'Create Finance Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows creating Finance records." },
  { id: 'FINANCE_UPDATE', label: 'Update Finance Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows updating Finance records." },
  { id: 'FINANCE_DELETE', label: 'Delete Finance Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows deleting Finance records." },
  { id: 'MARKETING_MANAGE', label: 'Manage Marketing Department', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows managing users and settings for the Marketing department." },
  { id: 'MARKETING_CREATE', label: 'Create Marketing Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows creating Marketing records." },
  { id: 'MARKETING_UPDATE', label: 'Update Marketing Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows updating Marketing records." },
  { id: 'MARKETING_DELETE', label: 'Delete Marketing Records', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows deleting Marketing records." },
] as const;

export type PlatformModule = typeof PLATFORM_MODULES[number];
export type PlatformModuleId = PlatformModule['id'];


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
  is_current_position?: boolean | string; // Allow string for automation, preprocess in Zod
  postition_level?: string | null | undefined;
}

export interface SkillEntry {
  segment_skill?: string;
  skill?: string[];
  skill_string?: string; // For UI binding if skills are comma-separated in input
}

export interface JobSuitableEntry {
  suitable_career?: string;
  suitable_job_position?: string;
  suitable_job_level?: string;
  suitable_salary_bath_month?: string;
}

export interface AutomationJobMatch {
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
    automationJobId?: string;
  };
  job_matches?: AutomationJobMatch[];
}

export interface AutomationCandidateWebhookEntry {
  candidate_info: CandidateDetails;
  jobs?: AutomationJobMatch[];
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

export type AutomationWebhookPayload = AutomationCandidateWebhookEntry;

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

export interface UserGroup { // This is now "Role" in the UI
  id: string;
  name: string;
  description?: string | null;
  permissions?: PlatformModuleId[];
  is_default?: boolean;
  is_system_role?: boolean;
  user_count?: number; // For API response
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
  groups?: UserGroup[]; // User can belong to multiple groups
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
export type SystemSettingKey =
  | 'appName'
  | 'appLogoDataUrl'
  | 'appThemePreference'
  | 'primaryGradientStart'
  | 'primaryGradientEnd'
  | 'smtpHost'
  | 'smtpPort'
  | 'smtpUser'
  | 'smtpSecure'
  | 'smtpFromEmail'
  | 'resumeProcessingWebhookUrl'
  | 'geminiApiKey'
  | 'loginPageBackgroundType'
  | 'loginPageBackgroundImageUrl'
  | 'loginPageBackgroundColor1'
  | 'loginPageBackgroundColor2'
  | 'loginPageLayoutType'
  // Sidebar Light Theme
  | 'sidebarBgStartL'
  | 'sidebarBgEndL'
  | 'sidebarTextL'
  | 'sidebarActiveBgStartL'
  | 'sidebarActiveBgEndL'
  | 'sidebarActiveTextL'
  | 'sidebarHoverBgL'
  | 'sidebarHoverTextL'
  | 'sidebarBorderL'
  // Sidebar Dark Theme
  | 'sidebarBgStartD'
  | 'sidebarBgEndD'
  | 'sidebarTextD'
  | 'sidebarActiveBgStartD'
  | 'sidebarActiveBgEndD'
  | 'sidebarActiveTextD'
  | 'sidebarHoverBgD'
  | 'sidebarHoverTextD'
  | 'sidebarBorderD'
  | 'appFontFamily'
  | 'loginPageContent'
  | 'maxConcurrentProcessors';


export interface SystemSetting {
    key: SystemSettingKey;
    value: string | null;
    updatedAt?: string;
}

export type LoginPageBackgroundType = "default" | "image" | "color" | "gradient";
export type LoginPageLayoutType = 'center' | '2column';


// Notification System Types
export interface NotificationEvent {
  id: string;
  event_key: string;
  label: string;
  description?: string | null;
  createdAt?: string;
}

export interface NotificationChannel {
  id: string;
  channel_key: 'email' | 'webhook';
  label: string;
  createdAt?: string;
}

export interface NotificationSetting {
  id?: string; // DB id
  eventId: string; // FK to NotificationEvent.id
  channelId: string; // FK to NotificationChannel.id
  isEnabled: boolean;
  configuration?: { webhookUrl?: string } | null; // For webhook URL, etc.
  createdAt?: string;
  updatedAt?: string;
}

// For GET /api/settings/notifications to combine data
export interface NotificationEventWithSettings extends NotificationEvent {
  channels: Array<{
    channelId: string;
    channelKey: 'email' | 'webhook';
    channelLabel: string;
    isEnabled: boolean;
    configuration?: { webhookUrl?: string } | null;
    settingId?: string; // ID of the NotificationSetting record, if exists
  }>;
}

// For the new Settings Layout sub-navigation
export interface SettingsNavigationItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description: string;
  adminOnly?: boolean;
  permissionId?: PlatformModuleId;
  adminOnlyOrPermission?: boolean;
}

export interface FilterableAttribute {
  path: string; // e.g., "name", "parsedData.personal_info.location"
  label: string; // e.g., "Candidate Name", "Location (Resume)"
  type: 'string' | 'number' | 'date' | 'boolean' | 'array_string'; // To guide potential future UI or backend logic
}

// For Bulk Actions
export type CandidateBulkAction = 'delete' | 'change_status' | 'assign_recruiter';
export type PositionBulkAction = 'delete' | 'change_status'; // Added 'change_status'

export interface CandidateBulkActionPayload {
  action: CandidateBulkAction;
  candidateIds: string[];
  newStatus?: CandidateStatus; // For 'change_status'
  notes?: string | null; // For 'change_status' transition notes
  newRecruiterId?: string | null; // For 'assign_recruiter'
}

export interface PositionBulkActionPayload {
  action: PositionBulkAction;
  positionIds: string[];
  newIsOpenStatus?: boolean; // For 'change_status'
}
