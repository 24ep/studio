import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const AUTOMATION_INTEGRATION_PLATFORM_MODULES: PlatformModule[] = [
  // ===== AUTOMATION & INTEGRATION =====

  {
    id: 'WEBHOOKS_VIEW',
    label: 'View Webhook Configurations',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: "View webhook integration settings",
    detailedDescription: "Access to view webhook configurations and integration settings.",
    impact: "Read-only access to integration settings. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'WEBHOOKS_EDIT',
    label: 'Edit Webhook Configurations',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: "Configure webhook integrations",
    detailedDescription: "Ability to create, edit, and delete webhook integrations. Controls external system connections.",
    impact: "Can modify external system integrations. Affects data flow and automation.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  {
    id: 'AI_INTEGRATION_VIEW',
    label: 'View AI Integration Settings',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: "View AI service configurations",
    detailedDescription: "Access to view AI integration settings including API keys and service configurations.",
    impact: "Read-only access to AI settings. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'AI_INTEGRATION_EDIT',
    label: 'Edit AI Integration Settings',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: "Configure AI service integrations",
    detailedDescription: "Ability to configure AI services like Gemini for Applicant analysis and automation.",
    impact: "Can modify AI service configurations. Affects automated Applicant processing.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  {
    id: 'UPLOAD_QUEUE_VIEW',
    label: 'View Upload Queue',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: "View file upload queue status",
    detailedDescription: "Access to view the status of file uploads and processing queue.",
    impact: "Read-only access to upload status. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'UPLOAD_QUEUE_MANAGE',
    label: 'Manage Upload Queue',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: "Manage file upload processing",
    detailedDescription: "Ability to manage the file upload queue, retry failed uploads, and control processing.",
    impact: "Can control file processing and automation. Affects data import workflows.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'BULK_UPLOAD_EXECUTE',
    label: 'Execute Bulk Uploads',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: "Perform bulk Applicant uploads",
    detailedDescription: "Ability to execute bulk upload operations for Applicants and documents.",
    impact: "Can add large volumes of data quickly. Risk of data quality issues.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  {
    id: 'SCREENING_CREATE', label: 'Run Digital Footprint Screening',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: 'Queue consent-gated applicant and employee public-source screenings.',
    detailedDescription: 'Allows manual screening requests but never permits an automatic employment decision.',
    impact: 'Processes sensitive public-source information and requires consent.', riskLevel: 'HIGH', requiresApproval: true,
  },
  {
    id: 'SCREENING_VIEW', label: 'View Digital Footprint Screening',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: 'View screening status and non-sensitive finding metadata.',
    detailedDescription: 'Allows access to screening history without permission to make review decisions.',
    impact: 'Exposes sensitive review metadata.', riskLevel: 'HIGH', requiresApproval: true,
  },
  {
    id: 'SCREENING_REVIEW', label: 'Review Digital Footprint Findings',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: 'Confirm identity, dismiss, dispute, or classify findings.',
    detailedDescription: 'Allows human review while prohibiting automated applicant or employee status changes.',
    impact: 'Review outcomes may inform a separately governed HR process.', riskLevel: 'CRITICAL', requiresApproval: true,
  },
  {
    id: 'SCREENING_EVIDENCE_VIEW', label: 'View Screening Evidence',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: 'Open source links and reviewed evidence excerpts.',
    detailedDescription: 'Controls access to the most sensitive screening evidence.',
    impact: 'Exposes potentially disputed personal information.', riskLevel: 'CRITICAL', requiresApproval: true,
  },
  {
    id: 'SCREENING_SETTINGS_MANAGE', label: 'Manage Screening Settings',
    category: PLATFORM_MODULE_CATEGORIES.AUTOMATION_INTEGRATION,
    description: 'Configure sources, automation, AI policy, quotas, and retention.',
    detailedDescription: 'Controls organization-wide screening behavior.',
    impact: 'Changes sensitive automated processing policy.', riskLevel: 'CRITICAL', requiresApproval: true,
  },

];
