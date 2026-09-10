import type { JsonObject, JsonValue } from './json-types';
import type { CustomFieldValues } from './custom-field-types';
import type { PlatformModuleId } from './platform-modules';

export { CUSTOM_FIELD_TYPES } from './custom-field-types';
export { PLATFORM_MODULE_CATEGORIES, PLATFORM_MODULES } from './platform-modules';
export type {
  AttributePreference,
  CustomFieldDefinition,
  CustomFieldOption,
  CustomFieldType,
  CustomFieldValue,
  CustomFieldValues,
  ModelAttributeDefinition,
  UIDisplayPreference,
} from './custom-field-types';
export type {
  Attachment,
  CreateHeadcountRequest,
  Headcount,
  HeadcountStatus,
  HeadcountType,
  UpdateHeadcountRequest,
} from './headcount-types';
export type { PlatformModule, PlatformModuleCategory, PlatformModuleId } from './platform-modules';
export type {
  LoginPageBackgroundType,
  LoginPageLayoutType,
  SystemSetting,
  SystemSettingKey,
} from './system-setting-types';
export type {
  PaginationInfo,
  UploadQueueCountResponse,
  UploadQueueJob,
  UploadQueuePendingCountResponse,
  UploadQueueResponse,
  UploadQueueSummary,
} from './upload-queue-types';

// Core system statuses - these might still be useful for specific logic,
// but the full list of available stages will come from the RecruitmentStage table.
export type CoreApplicantStatus =
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
export type ApplicantStatus = string;

// Active Applicant statuses - Applicants that are not hired or rejected
export const ACTIVE_APPLICANT_STATUSES: CoreApplicantStatus[] = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview Scheduled',
  'Interviewing',
  'Offer Extended',
  'Offer Accepted',
  'On Hold'
];

// Utility function to get active Applicant statuses as a comma-separated string for queries
export function getActiveApplicantStatusesQuery(): string {
  return ACTIVE_APPLICANT_STATUSES.join(',');
}

export interface RecruitmentStage {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  is_system?: boolean;
  sortOrder?: number | null;
  createdAt?: string;
  updatedAt?: string;
  color_complete?: string | null; // Custom color for completed stage node
  color_badge?: string | null; // Custom color for badge on Applicant list
}

export interface TransitionRecord {
  id: string;
  applicantId?: string;
  positionId?: string | null;
  date: string;
  stage: ApplicantStatus; // Now a string to accommodate custom stages
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

// New structured education entry type
export interface StructuredEducationEntry {
  id?: string;
  university: string;
  major?: string;
  field?: string;
  campus?: string;
  startMonth: number; // 1-12
  startYear: number;
  endMonth?: number; // 1-12 or null for current
  endYear?: number; // null for current
  isCurrent: boolean;
  GPA?: string;
  duration?: string; // Calculated field
}

// New structured experience entry type
export interface StructuredExperienceEntry {
  id?: string;
  companyReferenceId?: string | null;
  companyReference?: CompanyReference | null;
  company: string;
  position: string;
  description?: string;
  startMonth: number; // 1-12
  startYear: number;
  endMonth?: number; // 1-12 or null for current
  endYear?: number; // null for current
  isCurrent: boolean;
  positionLevel?: string;
  duration?: string; // Calculated field
}

// Legacy types (keep for backward compatibility)
export interface EducationEntry {
  major?: string;
  field?: string;
  period?: string; // Legacy: "Jan 2022 - Dec 2024"
  duration?: string;
  GPA?: string;
  university?: string;
  campus?: string;
  // New structured fields (optional for migration)
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  isCurrent?: boolean;
}

export interface ExperienceEntry {
  companyReferenceId?: string | null;
  companyReference?: CompanyReference | null;
  company?: string;
  position?: string;
  description?: string;
  period?: string; // Legacy: "Jan 2022 - Dec 2024"
  duration?: string;
  is_current_position?: boolean;
  positionLevel?: string;
  // New structured fields (optional for migration)
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  isCurrent?: boolean;
}

export interface SkillEntry {
  segment_skill?: string;
  skill?: string[];
  skill_string?: string; // For UI binding if skills are comma-separated in input
}

// Removed JobSuitableEntry and job suitability features

export interface AutomationJobMatch {
  jobId?: string;
  jobTitle?: string | null;
  fitScore: number;
  matchReasons?: string[];
  matchReasons_string?: string | null;
  is_applied_job?: boolean;
}

export interface ApplicantDetails {
  cv_language?: string;
  personal_info: PersonalInfo;
  contact_info: ContactInfo;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  skills?: SkillEntry[];
  // job_suitable removed
  associatedMatchDetails?: {
    jobTitle: string;
    fitScore: number;
    reasons: string[];
    automationJobId?: string;
  };
  job_matches?: AutomationJobMatch[];
}

export interface AutomationApplicantWebhookEntry {
  applicant_info: ApplicantDetails;
  jobs?: AutomationJobMatch[];
  targetPositionId?: string | null;
  targetPositionTitle?: string | null;
  targetPositionDescription?: string | null;
  targetpositionLevel?: string | null;
  job_applied?: {
    jobId?: string | null;
    jobTitle?: string | null;
    fitScore?: number | null;
    justification?: string[];
  } | null;
}

export type AutomationWebhookPayload = AutomationApplicantWebhookEntry;

export interface OldParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  education?: string[];
  skills?: string[];
  experienceYears?: number;
  summary?: string;
}

export interface Grade {
  id: string;
  name: string;
  label?: string | null;
  description?: string | null;
  minLevel: number;
  maxLevel: number;
  slaDays: number;
  color?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Position {
  id: string;
  title: string;
  department: string;
  description?: string | null;
  matchCriteria?: string | null;
  isOpen: boolean;
  positionLevel?: string | null;
  positionAttribute?: string | null;
  probationPeriodDays?: number;
  probationEvaluationFrequencyDays?: number;
  companyId?: string | null;
  company?: CompanyReference | null;
  gradeId?: string | null;
  grade?: Grade | null;
  recruiterId?: string | null;
  recruiterName?: string | null;
  customAttributes?: CustomFieldValues | null;
  custom_attributes?: CustomFieldValues | null;
  customFields?: CustomFieldValues;
  createdAt?: string;
  updatedAt?: string;
  applicants?: Applicant[];
  webhook_payload?: JsonValue;
  upload_id?: string;
  applicantStats?: {
    totalApplied: number;
    appliedStatusCount: number;
    totalMatching: number;
  };
  pipelineStats?: {
    total: number;
    shortlisted: number;
    interviews: number;
    offers: number;
  };
  hiringTeamCount?: number;
}

export interface PositionLevel {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserGroup { // This is now "Role" in the UI
  id: string;
  name: string;
  description?: string | null;
  permissions?: PlatformModuleId[];
  isDefault?: boolean; // Changed from is_default to match Prisma schema
  isSystemRole?: boolean; // Changed from is_system_role to match Prisma schema
  user_count?: number; // For API response
  createdAt?: string;
  updatedAt?: string;
}

export interface UserTeamAssignmentCondition {
  department?: string[];
  officeLocation?: string[];
  positionTitle?: string[];
  employeeType?: string[];
  companyName?: string[];
  manager?: string[];
}

export interface UserTeam {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  isActive: boolean;
  assignmentMode?: 'manual' | 'automatic';
  assignmentConditions?: UserTeamAssignmentCondition;
  member_count?: number; // For API response
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicantSource {
  id: string;
  name: string;
  description?: string | null;
  email?: string | null;
  logo?: string | null;
  allowSubSource: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyReference {
  id: string;
  name: string;
  legalName?: string | null;
  logo?: string | null;
  website?: string | null;
  domain?: string | null;
  industry?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  metadata?: JsonObject | null;
  source?: string | null;
  externalId?: string | null;
  appkitAppId?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  expectedSalary?: number | null;
  avatarUrl?: string | null; // For Applicant profile image
  dataAiHint?: string | null; // For Applicant profile image
  resumePath?: string | null; // Current/primary resume
  parsedData: ApplicantDetails | OldParsedResumeData | null;
  positionId: string | null;
  position?: Position | null;
  companyId?: string | null;
  company?: CompanyReference | null;
  employee?: {
    id: string;
    employeeNumber: string;
  } | null;
  fitScore: number;
  statusId: string; // Now references RecruitmentStage.id
  status?: string | null; // For backward compatibility - the actual status name
  recruitmentStage?: RecruitmentStage | null;
  applicationDate: string;
  recruiterId?: string | null;
  recruiter?: (Pick<UserProfile, 'id' | 'name' | 'email' | 'personalColor'> & { avatarUrl?: string | null }) | null;
  sourceId?: string | null;
  source?: ApplicantSource | null;
  subSource?: string | null;
  customFields?: CustomFieldValues;
  customAttributes?: CustomFieldValues | null;
  assignmentJustification?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isPinned?: boolean;
  pinnedAt?: string | null;
  isBlacklisted?: boolean;
  isRead?: boolean | null; // Per-user read status (null if not set for current user)
  emailDate?: string | null; // Date from email when Applicant applied via email
  emailSubject?: string | null; // Subject line of the application email
  emailId?: string | null; // Unique email message ID
  emailMetadata?: JsonObject | null; // Additional email metadata (headers, etc.)
  transitionHistory: TransitionRecord[];
  educationData?: StructuredEducationEntry[];
  experienceData?: StructuredExperienceEntry[];
  jobMatches?: JobMatch[]; // Job matches from the JobMatch table
  associationType?: 'applied' | 'matched' | 'applied_and_matched'; // For position-specific Applicant lists
}

export interface ResumeHistoryEntry {
  id: string;
  applicantId: string;
  filePath: string;
  originalFileName: string;
  uploadedAt: string;
  uploadedByUserId?: string | null;
  uploadedByUserName?: string | null; // For display
}

// Database model for JobMatch (matches Prisma schema)
export interface JobMatch {
  id: string;
  applicantId: string;
  jobId?: string | null;
  jobTitle?: string | null;
  fitScore: number;
  matchReasons?: string[] | null;
  jobDescriptionSummary?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Database model for ResumeHistory (now using Attachment table)
export interface ResumeHistory {
  id: string;
  applicantId: string;
  filePath: string;
  originalFileName: string;
  uploadedAt: string;
  uploadedByUserId?: string | null;
  uploadedByUserName?: string | null; // For display purposes, populated by JOIN
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  dataAiHint?: string;
  personalColor?: string;
  role: 'Admin' | 'Recruiter' | 'Hiring Manager' | 'Employee';
  password?: string;
  authenticationMethods?: string[];
  isActive?: boolean;
  userTeamId?: string | null; // Direct foreign key to UserTeam
  userGroupId?: string | null; // Direct foreign key to UserGroup
  modulePermissions?: PlatformModuleId[];
  positionTitle?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Derived/expanded fields for UI convenience
  teams?: { id: string; name: string; color?: string }[];
  userGroupName?: string | null;
  lastLogin?: string | null; // Last login timestamp from audit logs
  customFields?: CustomFieldValues;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'totp' | 'email';

  // Azure AD / HRIS Synced Fields
  department?: string | null;
  officeLocation?: string | null;
  employeeType?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  employeeId?: string | null;
  manager?: string | null;
  managerEmail?: string | null;
  phoneNumber?: string | null;
  hireDate?: string | Date | null;
  samAccountName?: string | null;
  contactInfo?: UserContactInfo | null;
}

export type UserContactInfo = JsonObject & {
  mobilePhone?: string | null;
  businessPhone?: string | null;
};

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'AUDIT';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: string;
  actingUserId?: string | null;
  actingUserName?: string | null;
  details?: JsonObject | null;
  createdAt?: string;
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
  label: string; // e.g., "Applicant Name", "Location (Resume)"
  type: 'string' | 'number' | 'date' | 'boolean' | 'array_string'; // To guide potential future UI or backend logic
}

// For Bulk Actions
export type ApplicantBulkAction = 'delete' | 'change_status' | 'assign_recruiter';
export type PositionBulkAction = 'delete' | 'change_status'; // Added 'change_status'

export interface ApplicantBulkActionPayload {
  action: ApplicantBulkAction;
  applicantIds: string[];
  newStatus?: ApplicantStatus; // For 'change_status'
  notes?: string | null; // For 'change_status' transition notes
  newRecruiterId?: string | null; // For 'assign_recruiter'
}

export interface PositionBulkActionPayload {
  action: PositionBulkAction;
  positionIds: string[];
  newIsOpenStatus?: boolean; // For 'change_status'
}



export type positionLevel = string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  image?: string;
  dataAiHint?: string;
  personalColor?: string;
  authenticationMethods?: string[];
  forcePasswordChange?: boolean;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  azure_oid?: string;
  department?: string | null;
  phoneNumber?: string | null;
  officeLocation?: string | null;
  positionTitle?: string | null;
  employeeId?: string | null;
  companyName?: string | null;
  employeeType?: string | null;
  hireDate?: Date | null;
  manager?: string | null;
  managerEmail?: string | null;
  samAccountName?: string | null;
  contactInfo?: JsonObject | null; // To store full contact details JSON
}

export type ApplicantCustomFieldFilterValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | null
  | undefined;

export interface ApplicantFilterValues {
  name?: string;
  nameOperator?: 'contains' | 'is' | 'startsWith' | 'endsWith';
  email?: string;
  emailOperator?: 'contains' | 'is' | 'startsWith' | 'endsWith';
  phone?: string;
  phoneOperator?: 'contains' | 'is' | 'startsWith' | 'endsWith';
  selectedPositionIds?: string[];
  selectedStatuses?: string[];
  selectedRecruiterIds?: string[]; // Added
  selectedSourceIds?: string[];
  education?: string; // Education Keywords
  skills?: string; // Skills Keywords
  location?: string; // Location
  locationOperator?: 'contains' | 'is' | 'startsWith' | 'endsWith' | 'other'; // Added
  cvLanguage?: string; // CV Language
  jobSuitableCareer?: string; // Job Suitable Career
  jobSuitableLevel?: string; // Job Suitable Level
  jobSuitablePosition?: string; // Job Suitable Position
  minExperienceYears?: number; // Minimum Experience Years
  maxExperienceYears?: number; // Maximum Experience Years
  minAppliedJobFitScore?: number; // Min fit score for applied job
  maxAppliedJobFitScore?: number; // Max fit score for applied job
  minMatchingJobFitScore?: number; // Min fit score for matching job
  maxMatchingJobFitScore?: number; // Max fit score for matching job
  applicationDateStart?: Date;
  applicationDateEnd?: Date;
  includeNoScoreInApplied?: boolean;
  includeNoScoreInMatching?: boolean;
  
  // AI Search fields
  aiSearchQuery?: string;
  aiSearchType?: 'semantic' | 'exact' | 'hybrid';
  aiSearchFilters?: Record<string, unknown>;
  
  // Custom fields
  customFieldFilters?: Record<string, ApplicantCustomFieldFilterValue>;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
  password?: string;
  groupIds?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  groupIds?: string[];
}


