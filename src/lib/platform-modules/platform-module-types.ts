// Platform module metadata and permission IDs.

// Define platform module IDs with categories
export const PLATFORM_MODULE_CATEGORIES = {
  APPLICANT_MANAGEMENT: "Applicant Management",
  POSITION_MANAGEMENT: "Position Management",
  USER_ACCESS_CONTROL: "User Access Control",
  SYSTEM_CONFIGURATION: "System Configuration",
  LOGGING_AUDIT: "Logging & Audit",
  ANALYTICS_REPORTING: "Analytics & Reporting",
  AUTOMATION_INTEGRATION: "Automation & Integration",
  HR_OPERATIONS: "HR Operations",
} as const;

export type PlatformModuleCategory = typeof PLATFORM_MODULE_CATEGORIES[keyof typeof PLATFORM_MODULE_CATEGORIES];

export interface PlatformModule {
  id: string;
  label: string;
  category: PlatformModuleCategory;
  description: string;
  detailedDescription: string;
  impact: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresApproval?: boolean;
}

export type PlatformModuleId = PlatformModule['id'];
