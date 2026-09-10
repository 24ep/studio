import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const APPLICANT_PLATFORM_MODULES: PlatformModule[] = [
  // ===== Applicant MANAGEMENT =====

  {
    id: 'FRIEND_REFERRALS_ACCESS',
    label: 'Access Friend Referrals',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: 'Refer friends and track submitted referrals',
    detailedDescription: 'Allows users to open the Friend Referrals workspace, submit a referral, and track referral progress.',
    impact: 'Can submit and view friend referrals.',
    riskLevel: 'LOW'
  },

  // View Permissions
  {
    id: 'applicantS_VIEW',
    label: 'View Applicants',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "View basic Applicant profiles",
    detailedDescription: "Allows users to view the list of Applicants and their basic profile information. Does not include access to sensitive data.",
    impact: "Basic read access to Applicant list.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_VIEW_ALL',
    label: 'View All Applicants (Unrestricted)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "View all Applicants regardless of position assignment",
    detailedDescription: "For hiring managers: allows viewing all Applicants in the system, not just those for positions where the user is assigned as an interviewer. Overrides the system-wide restriction setting.",
    impact: "Can view all Applicants regardless of position assignment. Important for senior hiring managers who need oversight.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_VIEW_DETAILED',
    label: 'View Detailed Info',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "View resumes and interview notes",
    detailedDescription: "Grant access to sensitive Applicant details such as resumes, cover letters, interview notes, and salary expectations.",
    impact: "Access to sensitive personal data.",
    riskLevel: 'MEDIUM'
  },

  // Create/Edit Permissions
  {
    id: 'applicantS_CREATE',
    label: 'Create New Applicants',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Add new Applicant profiles to the system",
    detailedDescription: "Ability to create new Applicant profiles, add basic information, and initiate the recruitment process for new Applicants.",
    impact: "Can add new Applicants to the recruitment pipeline. Affects data quality and system integrity.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_EDIT_BASIC',
    label: 'Edit Applicants',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Edit main contact details",
    detailedDescription: "Allows editing of basic Applicant information like name, email, and phone number.",
    impact: "Can modify contact info.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_EDIT_SENSITIVE',
    label: 'Edit Sensitive Applicant Information',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Edit sensitive Applicant data including salary and notes",
    detailedDescription: "Ability to modify sensitive Applicant information including salary expectations, interview notes, internal comments, and assessment scores.",
    impact: "Can modify critical Applicant data that affects hiring decisions. High impact on recruitment process.",
    riskLevel: 'HIGH'
  },

  // Ownership-based Edit Permissions
  {
    id: 'applicantS_EDIT_BASIC_OWN',
    label: 'Edit Basic Information (Own Assigned)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Edit basic Applicant details for Applicants assigned to you",
    detailedDescription: "Ability to modify basic Applicant information (name, email, phone, general profile) only for Applicants assigned to you as recruiter.",
    impact: "Limited to own assigned Applicants. Lower risk as scope is restricted to personal workload.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_EDIT_SENSITIVE_OWN',
    label: 'Edit Sensitive Information (Own Assigned)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Edit sensitive Applicant data for Applicants assigned to you",
    detailedDescription: "Ability to modify sensitive Applicant information (salary, interview notes, internal comments, assessment scores) only for Applicants assigned to you as recruiter.",
    impact: "Limited to own assigned Applicants. Medium risk as scope is restricted but includes sensitive data.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_EDIT_BASIC_ALL',
    label: 'Edit Basic Information (All Applicants)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Edit basic Applicant details for all Applicants",
    detailedDescription: "Ability to modify basic Applicant information (name, email, phone, general profile) for any Applicant in the system, regardless of assignment.",
    impact: "Full access to all Applicant basic information. Higher risk as scope includes all Applicants.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_EDIT_SENSITIVE_ALL',
    label: 'Edit Sensitive Information (All Applicants)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Edit sensitive Applicant data for all Applicants",
    detailedDescription: "Ability to modify sensitive Applicant information (salary, interview notes, internal comments, assessment scores) for any Applicant in the system, regardless of assignment.",
    impact: "Full access to all Applicant sensitive information. High risk as scope includes all Applicants and sensitive data.",
    riskLevel: 'HIGH'
  },

  // Delete Permissions
  {
    id: 'applicantS_DELETE',
    label: 'Delete Applicant Profiles',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Permanently remove Applicant profiles from the system",
    detailedDescription: "Ability to permanently delete Applicant profiles and all associated data including resumes, notes, and history. This action cannot be undone.",
    impact: "Permanent data loss. Affects audit trails and compliance requirements.",
    riskLevel: 'CRITICAL',
    requiresApproval: true
  },



  // File Management
  {
    id: 'applicantS_RESUMES_UPLOAD',
    label: 'Upload Applicant Resumes',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Upload and manage Applicant resumes and documents",
    detailedDescription: "Ability to upload, replace, and manage Applicant resumes, cover letters, and other supporting documents.",
    impact: "Controls access to Applicant documentation. Critical for recruitment process.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_RESUMES_UPLOAD_OWN',
    label: 'Upload Resumes (Own Assigned)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Upload resumes for Applicants assigned to you",
    detailedDescription: "Ability to upload, replace, and manage Applicant resumes, cover letters, and other supporting documents only for Applicants assigned to you as recruiter.",
    impact: "Limited to own assigned Applicants. Lower risk as scope is restricted to personal workload.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_RESUMES_UPLOAD_ALL',
    label: 'Upload Resumes (All Applicants)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Upload resumes for any Applicant",
    detailedDescription: "Ability to upload, replace, and manage Applicant resumes, cover letters, and other supporting documents for any Applicant in the system, regardless of assignment.",
    impact: "Full access to Applicant documentation. Medium risk as affects all Applicant profiles.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_RESUMES_DELETE',
    label: 'Delete Applicant Documents',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Remove Applicant resumes and attachments",
    detailedDescription: "Ability to delete Applicant resumes, cover letters, and other uploaded documents. Permanent action.",
    impact: "Permanent loss of Applicant documentation. Affects compliance and audit trails.",
    riskLevel: 'HIGH'
  },

  // Comments and Notes
  {
    id: 'applicantS_COMMENTS_VIEW',
    label: 'View Applicant Comments',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "View comments and notes on Applicant profiles",
    detailedDescription: "Access to view all comments, notes, and internal feedback on Applicant profiles.",
    impact: "Read-only access to Applicant feedback and internal communications.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_COMMENTS_ADD',
    label: 'Add Applicant Comments',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Add comments and notes to Applicant profiles",
    detailedDescription: "Ability to add comments, notes, and feedback to Applicant profiles. Cannot edit or delete existing comments.",
    impact: "Can contribute to Applicant feedback and internal communications.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_COMMENTS_ADD_OWN',
    label: 'Add Comments (Own Assigned)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Add comments to Applicants assigned to you",
    detailedDescription: "Ability to add comments, notes, and feedback only to Applicant profiles assigned to you as recruiter.",
    impact: "Limited to own assigned Applicants. Very low risk as scope is restricted to personal workload.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_COMMENTS_ADD_ALL',
    label: 'Add Comments (All Applicants)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Add comments to any Applicant",
    detailedDescription: "Ability to add comments, notes, and feedback to any Applicant profile in the system, regardless of assignment.",
    impact: "Full access to Applicant communication. Medium risk as affects all Applicant profiles.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_COMMENTS_EDIT',
    label: 'Edit Applicant Comments',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Edit and delete Applicant comments and notes",
    detailedDescription: "Ability to edit and delete existing comments, notes, and feedback on Applicant profiles.",
    impact: "Can modify internal communications and feedback history.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_COMMENTS_VIEW_REMARK_ONLY',
    label: 'View Remarks to HM Only',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Only allowed to view 'Remark to HM' comments",
    detailedDescription: "Restricts the user to only see comments specifically marked as 'Remark to HM'. General comments and internal notes remain hidden.",
    impact: "Restricted access to Applicant communication.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_ACTIVITIES_VIEW',
    label: 'View Applicant Activities',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "View activity logs and status changes",
    detailedDescription: "Access to view the history of Applicant status changes, resume uploads, and other system-logged activities.",
    impact: "Read-only access to Applicant history and workflow progression.",
    riskLevel: 'LOW'
  },

  // Source Assignment
  {
    id: 'applicantS_SOURCE_ASSIGN',
    label: 'Assign Applicant Source',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Assign and change Applicant source (e.g., LinkedIn, Referral, Job Board)",
    detailedDescription: "Ability to assign and modify the source of Applicants (where they came from). Important for tracking recruitment effectiveness and attribution.",
    impact: "Affects recruitment analytics and source tracking. Important for measuring channel effectiveness.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_SOURCE_ASSIGN_BULK',
    label: 'Bulk Source Assignment',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Assign source for multiple Applicants at once",
    detailedDescription: "Ability to assign or change the source for multiple Applicants simultaneously. Useful for batch corrections.",
    impact: "Can affect multiple Applicant source attributions at once. Affects analytics accuracy.",
    riskLevel: 'MEDIUM'
  },

  // Recruiter Assignment
  {
    id: 'applicantS_RECRUITER_ASSIGN',
    label: 'Assign Recruiters',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Assign Applicants to recruiters",
    detailedDescription: "Allows assigning or reassigning Applicants to specific recruiters to manage workload.",
    impact: "Changes Applicant ownership.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_RECRUITER_ASSIGN_OWN',
    label: 'Assign Own Applicants to Recruiter',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Assign only your own Applicants to other recruiters",
    detailedDescription: "Ability to reassign Applicants that are currently assigned to you to other recruiters. Cannot assign Applicants assigned to others.",
    impact: "Limited to own assigned Applicants. Lower risk as scope is restricted to personal workload management.",
    riskLevel: 'LOW'
  },

  {
    id: 'applicantS_RECRUITER_ASSIGN_ALL',
    label: 'Assign All Applicants to Recruiter',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Assign any Applicant to recruiters",
    detailedDescription: "Ability to assign or reassign any Applicant in the system to any recruiter, regardless of current assignment.",
    impact: "Full access to Applicant ownership management. High risk as affects all Applicant assignments.",
    riskLevel: 'HIGH'
  },

  {
    id: 'applicantS_RECRUITER_ASSIGN_BULK',
    label: 'Bulk Recruiter Assignment',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Assign multiple Applicants to recruiters at once",
    detailedDescription: "Ability to assign multiple Applicants to recruiters simultaneously. Useful for workload balancing.",
    impact: "Can affect multiple recruiter workloads at once. Requires careful planning.",
    riskLevel: 'HIGH'
  },

  // Pipeline Stage Management
  {
    id: 'applicantS_PIPELINE_STAGE_UPDATE',
    label: 'Move Applicants',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Advance Applicants in pipeline",
    detailedDescription: "Allows moving Applicants between different stages of the hiring process (e.g., from Interview to Offer).",
    impact: "Advances the recruitment workflow.",
    riskLevel: 'HIGH'
  },

  {
    id: 'applicantS_PIPELINE_STAGE_UPDATE_OWN',
    label: 'Update Pipeline Stage (Own Assigned)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Move own assigned Applicants through pipeline stages",
    detailedDescription: "Ability to move Applicants assigned to you through different stages of the recruitment pipeline. Cannot update stages for Applicants assigned to other recruiters.",
    impact: "Limited to own assigned Applicants. Medium risk as scope is restricted but affects workflow progression.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'applicantS_PIPELINE_STAGE_UPDATE_ALL',
    label: 'Update Pipeline Stage (All Applicants)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Move any Applicant through pipeline stages",
    detailedDescription: "Ability to move any Applicant in the system through different stages of the recruitment pipeline, regardless of assignment.",
    impact: "Full access to Applicant workflow progression. High risk as affects all Applicant pipeline management.",
    riskLevel: 'HIGH'
  },

  {
    id: 'applicantS_PIPELINE_STAGE_BULK_UPDATE',
    label: 'Bulk Pipeline Stage Updates',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Update pipeline stage for multiple Applicants at once",
    detailedDescription: "Ability to move multiple Applicants through pipeline stages simultaneously. Useful for batch processing but requires careful oversight.",
    impact: "Can affect multiple Applicants' progression at once. High potential for unintended changes.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  // Import/Export
  {
    id: 'applicantS_IMPORT',
    label: 'Import Applicant Data',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Bulk import Applicant data from external sources",
    detailedDescription: "Ability to import Applicant data from CSV files, spreadsheets, or other external sources. Can create multiple Applicant profiles at once.",
    impact: "Can add large volumes of data quickly. Risk of data quality issues and duplicates.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  {
    id: 'applicantS_EXPORT',
    label: 'Export Applicant Data',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Export Applicant data to external formats",
    detailedDescription: "Ability to export Applicant data to CSV, Excel, or other formats. Includes personal and sensitive information.",
    impact: "Data can be taken outside the system. Important for data security and compliance.",
    riskLevel: 'MEDIUM'
  },

];
