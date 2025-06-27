// Define platform module IDs with categories
export const PLATFORM_MODULE_CATEGORIES = {
    CANDIDATE_MANAGEMENT: "Candidate Management",
    POSITION_MANAGEMENT: "Position Management",
    USER_ACCESS_CONTROL: "User Access Control",
    SYSTEM_CONFIGURATION: "System Configuration",
    LOGGING_AUDIT: "Logging & Audit",
    DEPARTMENT_MANAGEMENT: "Department Management",
};
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
    { id: 'HR_DEPARTMENT_MANAGE', label: 'Manage HR Department', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows full management of HR department including users, records, and settings." },
    { id: 'IT_DEPARTMENT_MANAGE', label: 'Manage IT Department', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows full management of IT department including users, records, and settings." },
    { id: 'FINANCE_DEPARTMENT_MANAGE', label: 'Manage Finance Department', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows full management of Finance department including users, records, and settings." },
    { id: 'MARKETING_DEPARTMENT_MANAGE', label: 'Manage Marketing Department', category: PLATFORM_MODULE_CATEGORIES.DEPARTMENT_MANAGEMENT, description: "Allows full management of Marketing department including users, records, and settings." },
];
export const CUSTOM_FIELD_TYPES = ['text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple'];
