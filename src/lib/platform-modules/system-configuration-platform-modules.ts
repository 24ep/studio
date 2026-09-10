import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const SYSTEM_CONFIGURATION_PLATFORM_MODULES: PlatformModule[] = [
  // ===== SYSTEM CONFIGURATION =====

  {
    id: 'SYSTEM_SETTINGS_VIEW',
    label: 'View System Settings',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "View system configuration settings",
    detailedDescription: "Access to view system settings including application name, logo, and basic configuration.",
    impact: "Read-only access to system configuration. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'SYSTEM_SETTINGS_EDIT',
    label: 'Edit System Settings',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "Modify system configuration settings",
    detailedDescription: "Ability to modify system settings including application name, logo, branding, and basic configuration.",
    impact: "Can modify system appearance and basic configuration. Affects all users.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'WARNING_CONFIGURATIONS_VIEW',
    label: 'View Warning Configurations',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "View warning threshold settings",
    detailedDescription: "Access to view system-wide warning threshold configurations, such as SLA violation limits and performance alerts.",
    impact: "Read-only access to system warning triggers.",
    riskLevel: 'LOW'
  },

  {
    id: 'WARNING_CONFIGURATIONS_MANAGE',
    label: 'Manage Warning Configurations',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "Modify warning threshold settings",
    detailedDescription: "Ability to create and modify system-wide warning threshold configurations. Affects what triggers SLA notifications and UI alerts.",
    impact: "Can change warning thresholds. Affects monitoring and alerting accuracy.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'RECRUITMENT_STAGES_VIEW',
    label: 'View Recruitment Stages',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "View recruitment pipeline stages",
    detailedDescription: "Access to view the recruitment pipeline stages and workflow configuration.",
    impact: "Read-only access to workflow configuration. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'RECRUITMENT_STAGES_EDIT',
    label: 'Edit Recruitment Stages',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "Modify recruitment pipeline stages",
    detailedDescription: "Ability to add, edit, and remove recruitment pipeline stages. Affects workflow for all Applicants.",
    impact: "Can modify recruitment workflow. Affects all active recruitment processes.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  {
    id: 'CUSTOM_FIELDS_VIEW',
    label: 'View Custom Fields',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "View custom field definitions",
    detailedDescription: "Access to view custom field definitions for Applicants and positions.",
    impact: "Read-only access to field definitions. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'CUSTOM_FIELDS_EDIT',
    label: 'Edit Custom Fields',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "Create and modify custom fields",
    detailedDescription: "Ability to create, edit, and delete custom fields for Applicants and positions. Affects data structure.",
    impact: "Can modify data structure and collection. Affects data integrity and reporting.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

];
