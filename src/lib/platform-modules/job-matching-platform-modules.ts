import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const JOB_MATCHING_PLATFORM_MODULES: PlatformModule[] = [
  // ===== JOB MATCHING =====

  {
    id: 'JOB_MATCH_VIEW',
    label: 'View Job Matches',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "View Applicant-job matching results",
    detailedDescription: "Access to view job matching results and Applicant-position compatibility scores.",
    impact: "Read-only access to matching data. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'JOB_MATCH_MANAGE',
    label: 'Manage Job Matches',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Create and modify job matches",
    detailedDescription: "Ability to create, edit, and delete job matches between Applicants and positions.",
    impact: "Can control Applicant-position matching. Affects recruitment strategy.",
    riskLevel: 'MEDIUM'
  },



];
