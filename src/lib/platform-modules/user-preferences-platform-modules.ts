import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const USER_PREFERENCES_PLATFORM_MODULES: PlatformModule[] = [
  // ===== USER PREFERENCES =====

  {
    id: 'USER_PREFERENCES_MANAGE_OWN',
    label: 'Manage Own Preferences',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "Manage personal UI preferences",
    detailedDescription: "Ability to manage personal UI display preferences, dashboard layouts, and user-specific settings.",
    impact: "Can modify personal user experience. No impact on other users.",
    riskLevel: 'LOW'
  },

  {
    id: 'USER_PREFERENCES_MANAGE_ALL',
    label: 'Manage All User Preferences',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: "Manage preferences for all users",
    detailedDescription: "Ability to manage UI preferences and settings for all users in the system.",
    impact: "Can modify user experience for all users. Affects system-wide usability.",
    riskLevel: 'MEDIUM'
  },

];
