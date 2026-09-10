import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const USER_ACCESS_PLATFORM_MODULES: PlatformModule[] = [
  // ===== USER ACCESS CONTROL =====

  {
    id: 'USERS_VIEW',
    label: 'View User Accounts',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "View user account information",
    detailedDescription: "Access to view user account information including names, roles, and basic profile data.",
    impact: "Read-only access to user data. No ability to modify accounts.",
    riskLevel: 'LOW'
  },

  {
    id: 'USERS_CREATE',
    label: 'Create User Accounts',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "Create new user accounts",
    detailedDescription: "Ability to create new user accounts, set initial passwords, and assign basic roles.",
    impact: "Can add new users to the system. Affects system access and security.",
    riskLevel: 'HIGH'
  },

  {
    id: 'USERS_EDIT',
    label: 'Edit User Accounts',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "Modify user account details",
    detailedDescription: "Ability to edit user account information including names, email addresses, and basic profile data.",
    impact: "Can modify user account information. Affects user experience and data accuracy.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'USERS_DELETE',
    label: 'Delete User Accounts',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "Remove user accounts from the system",
    detailedDescription: "Ability to delete user accounts and all associated data. Permanent action that affects system access.",
    impact: "Permanent removal of user access. Affects system security and data ownership.",
    riskLevel: 'CRITICAL',
    requiresApproval: true
  },

  {
    id: 'USERS_PERMISSIONS_MANAGE',
    label: 'Manage User Permissions',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "Assign and modify user permissions",
    detailedDescription: "Ability to assign, modify, and remove individual user permissions. Controls what users can do in the system.",
    impact: "Directly affects system security and user capabilities. Critical for access control.",
    riskLevel: 'CRITICAL',
    requiresApproval: true
  },

  {
    id: 'USER_GROUPS_VIEW',
    label: 'View User Groups/Roles',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "View user groups and role definitions",
    detailedDescription: "Access to view user groups, roles, and their associated permissions. Read-only access.",
    impact: "Read-only access to role definitions. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'USER_GROUPS_CREATE',
    label: 'Create User Groups/Roles',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "Create new user groups and roles",
    detailedDescription: "Ability to create new user groups, define roles, and set permission templates.",
    impact: "Can create new role definitions. Affects organizational structure and access control.",
    riskLevel: 'HIGH'
  },

  {
    id: 'USER_GROUPS_EDIT',
    label: 'Edit User Groups/Roles',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "Modify existing user groups and roles",
    detailedDescription: "Ability to edit user groups, modify role definitions, and update permission assignments.",
    impact: "Can modify role definitions and permissions. Affects all users with those roles.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  {
    id: 'USER_GROUPS_DELETE',
    label: 'Delete User Groups/Roles',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "Remove user groups and roles",
    detailedDescription: "Ability to delete user groups and roles. Affects all users assigned to those roles.",
    impact: "Can remove role definitions. Affects user access and organizational structure.",
    riskLevel: 'CRITICAL',
    requiresApproval: true
  },

  {
    id: 'ROLES_MANAGE',
    label: 'Manage Roles (Legacy)',
    category: PLATFORM_MODULE_CATEGORIES.USER_ACCESS_CONTROL,
    description: "Legacy permission for role management",
    detailedDescription: "Legacy permission that provides full role management capabilities. Consider using specific USER_GROUPS_* permissions instead.",
    impact: "Full control over role definitions and assignments.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

];
