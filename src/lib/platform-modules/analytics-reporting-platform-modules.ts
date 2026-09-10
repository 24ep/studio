import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const ANALYTICS_REPORTING_PLATFORM_MODULES: PlatformModule[] = [
  // ===== ANALYTICS & REPORTING =====

  {
    id: 'DASHBOARD_VIEW',
    label: 'View Dashboard Analytics',
    category: PLATFORM_MODULE_CATEGORIES.ANALYTICS_REPORTING,
    description: "View main dashboard and analytics",
    detailedDescription: "Access to view the main dashboard with recruitment metrics, analytics, and performance indicators.",
    impact: "Read-only access to analytics data. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'REPORTS_GENERATE',
    label: 'Generate Reports',
    category: PLATFORM_MODULE_CATEGORIES.ANALYTICS_REPORTING,
    description: "Create and export reports",
    detailedDescription: "Ability to generate custom reports, export data, and create analytics dashboards.",
    impact: "Can extract and analyze data. Important for data security and compliance.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'WEBHOOK_ANALYTICS_VIEW',
    label: 'View Webhook Analytics',
    category: PLATFORM_MODULE_CATEGORIES.ANALYTICS_REPORTING,
    description: "View webhook performance metrics",
    detailedDescription: "Access to view webhook performance analytics, success rates, and integration metrics.",
    impact: "Read-only access to integration analytics. No ability to modify.",
    riskLevel: 'LOW'
  },

];
