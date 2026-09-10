import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const LOGGING_AUDIT_PLATFORM_MODULES: PlatformModule[] = [
  // ===== LOGGING & AUDIT =====

  {
    id: 'LOGS_VIEW',
    label: 'View System Logs',
    category: PLATFORM_MODULE_CATEGORIES.LOGGING_AUDIT,
    description: "View system and audit logs",
    detailedDescription: "Access to view system logs, audit trails, and user activity records.",
    impact: "Read-only access to system logs. Important for compliance and security monitoring.",
    riskLevel: 'LOW'
  },

  {
    id: 'LOGS_EXPORT',
    label: 'Export System Logs',
    category: PLATFORM_MODULE_CATEGORIES.LOGGING_AUDIT,
    description: "Export system logs for analysis",
    detailedDescription: "Ability to export system logs and audit trails for external analysis and compliance reporting.",
    impact: "Can extract log data. Important for compliance and security investigations.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'AUDIT_CONTROLS_VIEW',
    label: 'View Audit Controls',
    category: PLATFORM_MODULE_CATEGORIES.LOGGING_AUDIT,
    description: 'View controls, evidence, exceptions, legal holds, and certifications',
    detailedDescription: 'Read-only access to the Audit & Controls workspace and scoped evidence packages.',
    impact: 'Exposes sensitive control and assurance information without allowing changes.',
    riskLevel: 'MEDIUM'
  },

  {
    id: 'AUDIT_EVIDENCE_MANAGE',
    label: 'Manage Audit Evidence',
    category: PLATFORM_MODULE_CATEGORIES.LOGGING_AUDIT,
    description: 'Collect and manage versioned control evidence',
    detailedDescription: 'Create controls, collect evidence, manage exceptions, and prepare audit packages.',
    impact: 'Can add evidence used for formal assurance. Independent review is required.',
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  {
    id: 'AUDIT_ACCESS_REVIEW_MANAGE',
    label: 'Manage Access Reviews',
    category: PLATFORM_MODULE_CATEGORIES.LOGGING_AUDIT,
    description: 'Launch and certify access-review campaigns',
    detailedDescription: 'Review access snapshots, segregation-of-duties conflicts, and remediation decisions.',
    impact: 'Can initiate access revocation and certify privileged access.',
    riskLevel: 'CRITICAL',
    requiresApproval: true
  },

  {
    id: 'AUDIT_RETENTION_MANAGE',
    label: 'Manage Retention and Legal Holds',
    category: PLATFORM_MODULE_CATEGORIES.LOGGING_AUDIT,
    description: 'Manage retention executions and legal holds',
    detailedDescription: 'Preview retention scope, approve disposal, and create or release legal holds.',
    impact: 'Can authorize irreversible data disposal. Dual approval is enforced.',
    riskLevel: 'CRITICAL',
    requiresApproval: true
  },

  {
    id: 'AUDIT_PERIOD_LOCK',
    label: 'Lock Audit Periods',
    category: PLATFORM_MODULE_CATEGORIES.LOGGING_AUDIT,
    description: 'Lock completed audit periods and their evidence manifests',
    detailedDescription: 'Finalizes a period so its included evidence cannot be changed or removed.',
    impact: 'Creates a formal external-audit evidence boundary.',
    riskLevel: 'CRITICAL',
    requiresApproval: true
  },

  {
    id: 'APP_PERFORMANCE_VIEW',
    label: 'View Performance Metrics',
    category: PLATFORM_MODULE_CATEGORIES.LOGGING_AUDIT,
    description: "View application performance data",
    detailedDescription: "Access to view application performance metrics, system health indicators, and monitoring data.",
    impact: "Read-only access to performance data. No ability to modify.",
    riskLevel: 'LOW'
  },

];
